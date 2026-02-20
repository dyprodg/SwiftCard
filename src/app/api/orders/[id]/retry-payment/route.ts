export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema/orders";
import { productVariants } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { stripe } from "@/lib/stripe/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // Atomic guard: only allow retry from FAILED (not PENDING — payment is in-flight)
    // First request wins; second gets 409 Conflict
    const [claimed] = await db
      .update(orders)
      .set({ paymentStatus: "PENDING" })
      .where(
        and(
          eq(orders.id, id),
          eq(orders.guestAccessToken, token),
          eq(orders.paymentStatus, "FAILED"),
        ),
      )
      .returning();

    if (!claimed) {
      // Either order doesn't exist, token is wrong, or status isn't FAILED
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, id),
      });

      if (!order || order.guestAccessToken !== token) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      if (order.status === "CANCELLED") {
        return NextResponse.json({ error: "Order has been cancelled" }, { status: 400 });
      }

      if (order.paymentStatus === "PENDING") {
        return NextResponse.json(
          { error: "Payment is already being processed" },
          { status: 409 },
        );
      }

      return NextResponse.json({ error: "Payment cannot be retried" }, { status: 400 });
    }

    // Get order items for stock re-lock
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

    // Re-lock stock in a transaction (stock was restored on failure)
    await db.transaction(async (tx) => {
      for (const item of items) {
        if (item.variantId) {
          const result = await tx
            .update(productVariants)
            .set({
              stock: sql`${productVariants.stock} - ${item.quantity}`,
            })
            .where(
              sql`${productVariants.id} = ${item.variantId} AND ${productVariants.stock} >= ${item.quantity}`,
            )
            .returning();

          if (result.length === 0) {
            throw new Error(`Not enough stock for "${item.productName}"`);
          }
        }
      }
    });

    // Create a NEW PaymentIntent (old one may be expired/terminal)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: claimed.total,
      currency: claimed.currency.toLowerCase(),
      metadata: {
        orderId: claimed.id,
        orderNumber: claimed.orderNumber,
        customerEmail: claimed.customerEmail,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update order with new PaymentIntent ID
    await db
      .update(orders)
      .set({ stripePaymentIntentId: paymentIntent.id })
      .where(eq(orders.id, id));

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Retry payment error:", error);
    const message = error instanceof Error ? error.message : "Retry payment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
