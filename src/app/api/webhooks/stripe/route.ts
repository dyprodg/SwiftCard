import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/db";
import { orders, orderRefunds } from "@/db/schema/orders";
import { eq, and } from "drizzle-orm";
import { constructEvent } from "@/lib/stripe/webhooks";
import { deleteCart } from "@/lib/kv";
import { handlePaymentSuccess } from "@/server/actions/orders";
import { sendPaymentFailedEmail } from "@/lib/resend";
import { buildOrderViewUrl } from "@/lib/utils/order-url";
import { convertReservations, expireReservations } from "@/lib/reservations";
import { logOrderEvent, logOrderEventTx } from "@/lib/utils/order-events";
import { sendDisputeNotificationEmail } from "@/lib/resend";
import { markCartRecovered } from "@/server/actions/abandoned-carts";

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

          if (!updated) {
            console.warn(
              `Webhook: stale PI ${paymentIntent.id} for order ${orderId} — already reconciled`,
            );
            break;
          }

          // Log payment + status events
          await logOrderEvent({
            orderId,
            type: "PAYMENT_STATUS_CHANGED",
            data: { from: "PENDING", to: "PAID" },
            createdBy: "stripe-webhook",
          });
          await logOrderEvent({
            orderId,
            type: "STATUS_CHANGED",
            data: { from: "PENDING", to: "CONFIRMED" },
            createdBy: "stripe-webhook",
          });

          // Convert reservations to permanent (stock stays decremented)
          await convertReservations(orderId);

          // Clear the cart + mark abandoned cart as recovered
          if (cartId) {
            await deleteCart(cartId).catch(() => {});
            // cartId format: "guest:SESSION_ID" — extract session
            const sessionIdFromCart = cartId.startsWith("guest:")
              ? cartId.slice(6)
              : cartId;
            await markCartRecovered(sessionIdFromCart).catch(() => {});
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

          if (!updated) {
            console.warn(
              `Webhook: stale PI ${paymentIntent.id} for failed order ${orderId} — already updated`,
            );
            break;
          }

          // Log payment failure event
          await logOrderEvent({
            orderId,
            type: "PAYMENT_STATUS_CHANGED",
            data: { from: "PENDING", to: "FAILED" },
            createdBy: "stripe-webhook",
          });

          // Expire reservations (restores stock)
          await expireReservations(orderId);

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

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;

        if (!paymentIntentId) break;

        // Find the order by PaymentIntent ID
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.stripePaymentIntentId, paymentIntentId));

        if (!order) {
          console.warn(`Webhook charge.refunded: no order for PI ${paymentIntentId}`);
          break;
        }

        // Process each refund in the charge
        const refundsList = charge.refunds?.data ?? [];
        for (const stripeRefund of refundsList) {
          // Idempotency: check if this refund is already recorded
          const existing = await db.query.orderRefunds.findFirst({
            where: eq(orderRefunds.stripeRefundId, stripeRefund.id),
          });

          if (existing) continue;

          const refundAmount = stripeRefund.amount;

          await db.transaction(async (tx) => {
            const [currentOrder] = await tx
              .select({ totalRefunded: orders.totalRefunded, total: orders.total })
              .from(orders)
              .where(eq(orders.id, order.id));

            const newTotalRefunded = currentOrder.totalRefunded + refundAmount;
            const fullyRefunded = newTotalRefunded >= currentOrder.total;

            // Log refund event
            await logOrderEventTx(tx, {
              orderId: order.id,
              type: "REFUND_CREATED",
              data: {
                stripeRefundId: stripeRefund.id,
                amount: refundAmount,
                currency: order.currency,
                source: "stripe-dashboard",
              },
              createdBy: "stripe-webhook",
            });

            // Create reconciliation refund record
            await tx.insert(orderRefunds).values({
              orderId: order.id,
              stripeRefundId: stripeRefund.id,
              amount: refundAmount,
              currency: order.currency,
              reason: "OTHER",
              note: "Refund created externally via Stripe Dashboard",
              isFullRefund: fullyRefunded,
              stockRestored: false,
              createdBy: "stripe-webhook",
            });

            // Update order totals and status
            const updateData: Record<string, unknown> = {
              totalRefunded: newTotalRefunded,
              paymentStatus: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED",
            };

            if (fullyRefunded) {
              updateData.status = "REFUNDED";
            }

            await tx.update(orders).set(updateData).where(eq(orders.id, order.id));
          });
        }

        break;
      }

      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;

        if (orderId) {
          const [updated] = await db
            .update(orders)
            .set({
              status: "CANCELLED",
              paymentStatus: "FAILED",
              cancelledAt: new Date(),
            })
            .where(
              and(
                eq(orders.id, orderId),
                eq(orders.stripePaymentIntentId, paymentIntent.id),
              ),
            )
            .returning();

          if (updated) {
            await logOrderEvent({
              orderId,
              type: "STATUS_CHANGED",
              data: { from: updated.status, to: "CANCELLED", reason: "payment_canceled" },
              createdBy: "stripe-webhook",
            });

            // Expire reservations (restores stock)
            await expireReservations(orderId);
          }
        }

        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        const chargeId =
          typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;

        if (!chargeId) break;

        // Find order via PaymentIntent
        const piId =
          typeof dispute.payment_intent === "string"
            ? dispute.payment_intent
            : dispute.payment_intent?.id;

        if (!piId) break;

        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.stripePaymentIntentId, piId));

        if (!order) {
          console.warn(`Webhook charge.dispute.created: no order for PI ${piId}`);
          break;
        }

        // Log dispute event
        await logOrderEvent({
          orderId: order.id,
          type: "DISPUTE_OPENED",
          data: {
            disputeId: dispute.id,
            amount: dispute.amount,
            reason: dispute.reason,
            status: dispute.status,
          },
          createdBy: "stripe-webhook",
        });

        // Send admin notification email
        const contactEmail = process.env.ADMIN_EMAIL || process.env.RESEND_TEST_EMAIL;
        if (contactEmail) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          sendDisputeNotificationEmail(contactEmail, {
            orderNumber: order.orderNumber,
            disputeAmount: dispute.amount,
            currency: order.currency,
            reason: dispute.reason,
            customerEmail: order.customerEmail,
            adminUrl: `${appUrl}/en/admin/orders/${order.id}`,
          }).catch((err) => console.error("Failed to send dispute email:", err));
        }

        break;
      }

      case "charge.dispute.closed": {
        const dispute = event.data.object as Stripe.Dispute;
        const piId =
          typeof dispute.payment_intent === "string"
            ? dispute.payment_intent
            : dispute.payment_intent?.id;

        if (!piId) break;

        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.stripePaymentIntentId, piId));

        if (!order) break;

        await logOrderEvent({
          orderId: order.id,
          type: "DISPUTE_CLOSED",
          data: {
            disputeId: dispute.id,
            status: dispute.status, // "won", "lost", "warning_closed"
            reason: dispute.reason,
          },
          createdBy: "stripe-webhook",
        });

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
