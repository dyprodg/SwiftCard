import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema/orders";
import { productVariants } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { constructEvent } from "@/lib/stripe/webhooks";
import { deleteCart } from "@/lib/kv";
import { handlePaymentSuccess } from "@/server/actions/orders";
import { sendPaymentFailedEmail } from "@/lib/resend";
import { buildOrderViewUrl } from "@/lib/utils/order-url";

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
          // Guard against stale PaymentIntents (from pre-retry attempts)
          const [updated] = await db
            .update(orders)
            .set({
              status: "CONFIRMED",
              paymentStatus: "PAID",
              paidAt: new Date(),
            })
            .where(
              and(
                eq(orders.id, orderId),
                eq(orders.stripePaymentIntentId, paymentIntent.id),
              ),
            )
            .returning();

          if (!updated) break; // Stale PI — ignore

          // Clear the cart
          if (cartId) {
            await deleteCart(cartId).catch(() => {});
          }

          // Send order confirmation email
          await handlePaymentSuccess(orderId).catch((err) =>
            console.error("Failed to send order confirmation:", err),
          );
        }

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;

        if (orderId) {
          // Guard against stale PaymentIntents
          const [updated] = await db
            .update(orders)
            .set({
              paymentStatus: "FAILED",
            })
            .where(
              and(
                eq(orders.id, orderId),
                eq(orders.stripePaymentIntentId, paymentIntent.id),
              ),
            )
            .returning();

          if (!updated) break; // Stale PI — ignore

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

          // Send payment-failed email
          const orderViewUrl = buildOrderViewUrl(
            updated.id,
            updated.guestAccessToken,
            "en",
          );
          sendPaymentFailedEmail(updated.customerEmail, {
            orderNumber: updated.orderNumber,
            total: updated.total,
            currency: updated.currency,
            orderViewUrl,
          }).catch((err) => console.error("Failed to send payment-failed email:", err));
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
