import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema/orders";
import { and, eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe/client";
import { createReservationsInTx } from "@/lib/reservations";
import { getReservationSettings } from "@/lib/edge-config";

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

    // Re-lock stock via reservations (old reservations were expired on payment failure)
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("cart_session")?.value ?? "retry";
    const reservationSettings = await getReservationSettings();

    await db.transaction(async (tx) => {
      await createReservationsInTx(
        tx,
        items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          productName: item.productName,
        })),
        sessionId,
        id,
        reservationSettings.timeoutMinutes,
      );
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
