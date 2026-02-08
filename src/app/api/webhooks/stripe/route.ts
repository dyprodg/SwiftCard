import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema/orders";
import { productVariants } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { constructEvent } from "@/lib/stripe/webhooks";
import { deleteCart } from "@/lib/kv";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;
        const cartId = paymentIntent.metadata.cartId;

        if (orderId) {
          // Update order status
          await db
            .update(orders)
            .set({
              status: "CONFIRMED",
              paymentStatus: "PAID",
              paidAt: new Date(),
            })
            .where(eq(orders.id, orderId));

          // Clear the cart
          if (cartId) {
            await deleteCart(cartId).catch(() => {});
          }
        }

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;

        if (orderId) {
          // Update order status
          await db
            .update(orders)
            .set({
              paymentStatus: "FAILED",
            })
            .where(eq(orders.id, orderId));

          // Restore stock for each order item
          const items = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, orderId));

          for (const item of items) {
            if (item.variantId) {
              await db
                .update(productVariants)
                .set({
                  stock: sql`${productVariants.stock} + ${item.quantity}`,
                })
                .where(eq(productVariants.id, item.variantId));
            }
          }
        }

        break;
      }

      default:
        // Unhandled event type
        break;
    }
  } catch (error) {
    console.error(`Error handling webhook event ${event.type}:`, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
