import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { productVariants } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
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

    // Find order and validate token
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { items: true },
    });

    if (!order || order.guestAccessToken !== token) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Only allow retry for FAILED or PENDING payments on non-cancelled orders
    if (order.status === "CANCELLED") {
      return NextResponse.json({ error: "Order has been cancelled" }, { status: 400 });
    }

    if (order.paymentStatus !== "FAILED" && order.paymentStatus !== "PENDING") {
      return NextResponse.json({ error: "Payment cannot be retried" }, { status: 400 });
    }

    // Re-lock stock in a transaction (stock was restored on failure)
    await db.transaction(async (tx) => {
      for (const item of order.items) {
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
      amount: order.total,
      currency: order.currency.toLowerCase(),
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update order with new PaymentIntent ID and reset payment status
    await db
      .update(orders)
      .set({
        stripePaymentIntentId: paymentIntent.id,
        paymentStatus: "PENDING",
      })
      .where(eq(orders.id, order.id));

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Retry payment error:", error);
    const message = error instanceof Error ? error.message : "Retry payment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
