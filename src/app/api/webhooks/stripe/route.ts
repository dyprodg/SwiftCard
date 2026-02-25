import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/db";
import { orders, orderItems, orderRefunds } from "@/db/schema/orders";
import { subscriptions, subscriptionPlans } from "@/db/schema/subscriptions";
import { products, productVariants } from "@/db/schema/products";
import { eq, and } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { constructEvent } from "@/lib/stripe/webhooks";
import { deleteCart } from "@/lib/kv";
import { handlePaymentSuccess } from "@/server/actions/orders";
import {
  sendPaymentFailedEmail,
  sendDisputeNotificationEmail,
  sendSubscriptionConfirmedEmail,
  sendSubscriptionRenewedEmail,
  sendSubscriptionPaymentFailedEmail,
  sendSubscriptionCancelledEmail,
} from "@/lib/resend";
import { buildOrderViewUrl } from "@/lib/utils/order-url";
import { convertReservations, expireReservations } from "@/lib/reservations";
import { logOrderEvent, logOrderEventTx } from "@/lib/utils/order-events";
import { markCartRecovered } from "@/server/actions/abandoned-carts";
import { generateOrderNumber } from "@/lib/utils/order-number";
import { calculateSubscriptionPrice } from "@/lib/utils/subscription-price";

function randomSeq() {
  return Math.floor(1000 + Math.random() * 9000);
}

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

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        const isDraftOrder = session.metadata?.isDraftOrder === "true";
        const isSubscription = session.metadata?.isSubscription === "true";

        if (isSubscription && session.mode === "subscription") {
          // ── Subscription checkout completed ──
          const planId = session.metadata?.planId;
          const userId = session.metadata?.userId;
          const email = session.metadata?.email || session.customer_email || "";
          const stripeSubId =
            typeof session.subscription === "string"
              ? session.subscription
              : (session.subscription as { id: string } | null)?.id;
          const stripeCustomerId =
            typeof session.customer === "string"
              ? session.customer
              : (session.customer as { id: string } | null)?.id;

          if (planId && userId && stripeSubId && stripeCustomerId) {
            // Prevent duplicate
            const existing = await db.query.subscriptions.findFirst({
              where: eq(subscriptions.stripeSubscriptionId, stripeSubId),
            });

            if (!existing) {
              const plan = await db.query.subscriptionPlans.findFirst({
                where: eq(subscriptionPlans.id, planId),
              });

              if (plan) {
                const product = await db.query.products.findFirst({
                  where: eq(products.id, plan.productId),
                });
                let variant = null;
                if (plan.variantId) {
                  variant = await db.query.productVariants.findFirst({
                    where: eq(productVariants.id, plan.variantId),
                  });
                }

                const unitPrice = calculateSubscriptionPrice(
                  product?.basePrice ?? 0,
                  variant?.priceAdjustment ?? 0,
                  plan.discountPercent,
                );

                // Create subscription record
                const [sub] = await db
                  .insert(subscriptions)
                  .values({
                    planId,
                    customerId: userId,
                    customerEmail: email,
                    stripeSubscriptionId: stripeSubId,
                    stripeCustomerId,
                    status: "ACTIVE",
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // approximate, will be corrected by invoice.paid
                  })
                  .returning();

                // Create initial order
                const orderNumber = generateOrderNumber(randomSeq());
                const variantName = variant
                  ? [variant.size, variant.color, variant.material]
                      .filter(Boolean)
                      .join(" / ") || null
                  : null;

                const [order] = await db
                  .insert(orders)
                  .values({
                    orderNumber,
                    status: "CONFIRMED",
                    paymentStatus: "PAID",
                    subtotal: unitPrice,
                    tax: 0,
                    shipping: 0,
                    total: unitPrice,
                    customerEmail: email,
                    customerId: userId,
                    shippingName: email,
                    shippingAddress1: "Subscription",
                    shippingCity: "—",
                    shippingZip: "—",
                    shippingCountry: "CH",
                    paidAt: new Date(),
                    subscriptionId: sub.id,
                  })
                  .returning();

                await db.insert(orderItems).values({
                  orderId: order.id,
                  productId: plan.productId,
                  variantId: plan.variantId,
                  productName: product?.name ?? "Subscription",
                  variantName,
                  quantity: 1,
                  unitPrice,
                  total: unitPrice,
                });

                await logOrderEvent({
                  orderId: order.id,
                  type: "SUBSCRIPTION_CREATED",
                  data: { subscriptionId: sub.id, planId, planName: plan.name },
                  createdBy: "stripe-webhook",
                });

                // Send confirmation email
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
                sendSubscriptionConfirmedEmail(email, {
                  planName: plan.name,
                  interval: plan.interval.toLowerCase(),
                  price: unitPrice,
                  currency: "CHF",
                  nextBillingDate: new Date(
                    Date.now() + 30 * 24 * 60 * 60 * 1000,
                  ).toLocaleDateString("de-CH"),
                  manageUrl: `${appUrl}/en/account/subscriptions`,
                }).catch((err) =>
                  console.error("Failed to send subscription confirmed email:", err),
                );

                revalidateTag("subscriptions", "minutes");
              }
            }
          }
          break;
        }

        if (orderId && isDraftOrder) {
          // Draft order payment completed via Checkout Session
          const paymentIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id;

          const [updated] = await db
            .update(orders)
            .set({
              status: "CONFIRMED",
              paymentStatus: "PAID",
              paidAt: new Date(),
              stripePaymentIntentId: paymentIntentId || null,
            })
            .where(
              and(eq(orders.id, orderId), eq(orders.stripeCheckoutSessionId, session.id)),
            )
            .returning();

          if (!updated) {
            console.warn(
              `Webhook: checkout.session.completed for order ${orderId} — already processed`,
            );
            break;
          }

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

          // Convert reservations to permanent
          await convertReservations(orderId);

          // Send order confirmation email
          await handlePaymentSuccess(orderId).catch((err) =>
            console.error("Failed to send order confirmation for draft:", err),
          );
        }

        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        const isDraftOrder = session.metadata?.isDraftOrder === "true";

        if (orderId && isDraftOrder) {
          // Payment link expired — revert to DRAFT so admin can resend
          const [updated] = await db
            .update(orders)
            .set({
              status: "DRAFT",
              paymentLinkUrl: null,
              paymentLinkExpiresAt: null,
              stripeCheckoutSessionId: null,
            })
            .where(
              and(eq(orders.id, orderId), eq(orders.stripeCheckoutSessionId, session.id)),
            )
            .returning();

          if (updated) {
            await logOrderEvent({
              orderId,
              type: "PAYMENT_LINK_EXPIRED",
              data: { sessionId: session.id },
              createdBy: "stripe-webhook",
            });
            await logOrderEvent({
              orderId,
              type: "STATUS_CHANGED",
              data: { from: "PENDING", to: "DRAFT" },
              createdBy: "stripe-webhook",
            });

            // Expire reservations (restore stock)
            await expireReservations(orderId);
          }
        }

        break;
      }

      case "invoice.paid": {
        // Use generic record for cross-version Stripe API compatibility
        const invoice = event.data.object as unknown as Record<string, unknown>;
        // Only handle subscription renewals (not initial payment)
        if (invoice.subscription && invoice.billing_reason === "subscription_cycle") {
          const rawSub = invoice.subscription;
          const stripeSubId =
            typeof rawSub === "string" ? rawSub : (rawSub as { id: string }).id;

          const sub = await db.query.subscriptions.findFirst({
            where: eq(subscriptions.stripeSubscriptionId, stripeSubId),
            with: {
              plan: {
                with: {
                  product: true,
                  variant: true,
                },
              },
            },
          });

          if (sub) {
            const unitPrice = calculateSubscriptionPrice(
              sub.plan.product.basePrice,
              sub.plan.variant?.priceAdjustment ?? 0,
              sub.plan.discountPercent,
            );

            // Update period
            const periodStart = invoice.period_start as number | undefined;
            const periodEnd = invoice.period_end as number | undefined;
            await db
              .update(subscriptions)
              .set({
                status: "ACTIVE",
                currentPeriodStart: periodStart
                  ? new Date(periodStart * 1000)
                  : new Date(),
                currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
              })
              .where(eq(subscriptions.id, sub.id));

            // Create renewal order
            const orderNumber = generateOrderNumber(randomSeq());
            const variantName = sub.plan.variant
              ? [sub.plan.variant.size, sub.plan.variant.color, sub.plan.variant.material]
                  .filter(Boolean)
                  .join(" / ") || null
              : null;

            const [order] = await db
              .insert(orders)
              .values({
                orderNumber,
                status: "CONFIRMED",
                paymentStatus: "PAID",
                subtotal: unitPrice,
                tax: 0,
                shipping: 0,
                total: unitPrice,
                customerEmail: sub.customerEmail,
                customerId: sub.customerId,
                shippingName: sub.customerEmail,
                shippingAddress1: "Subscription Renewal",
                shippingCity: "—",
                shippingZip: "—",
                shippingCountry: "CH",
                paidAt: new Date(),
                subscriptionId: sub.id,
              })
              .returning();

            await db.insert(orderItems).values({
              orderId: order.id,
              productId: sub.plan.productId,
              variantId: sub.plan.variantId,
              productName: sub.plan.product.name,
              variantName,
              quantity: 1,
              unitPrice,
              total: unitPrice,
            });

            await logOrderEvent({
              orderId: order.id,
              type: "SUBSCRIPTION_RENEWED",
              data: { subscriptionId: sub.id, planName: sub.plan.name },
              createdBy: "stripe-webhook",
            });

            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            sendSubscriptionRenewedEmail(sub.customerEmail, {
              planName: sub.plan.name,
              orderNumber,
              price: unitPrice,
              currency: "CHF",
              nextBillingDate: periodEnd
                ? new Date(periodEnd * 1000).toLocaleDateString("de-CH")
                : "—",
              manageUrl: `${appUrl}/en/account/subscriptions`,
            }).catch((err) =>
              console.error("Failed to send subscription renewed email:", err),
            );

            revalidateTag("subscriptions", "minutes");
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const failedInvoice = event.data.object as unknown as Record<string, unknown>;
        if (failedInvoice.subscription) {
          const rawFailedSub = failedInvoice.subscription;
          const stripeSubId =
            typeof rawFailedSub === "string"
              ? rawFailedSub
              : (rawFailedSub as { id: string }).id;

          const sub = await db.query.subscriptions.findFirst({
            where: eq(subscriptions.stripeSubscriptionId, stripeSubId),
            with: { plan: { with: { product: true, variant: true } } },
          });

          if (sub && sub.status !== "PAST_DUE") {
            await db
              .update(subscriptions)
              .set({ status: "PAST_DUE" })
              .where(eq(subscriptions.id, sub.id));

            const unitPrice = calculateSubscriptionPrice(
              sub.plan.product.basePrice,
              sub.plan.variant?.priceAdjustment ?? 0,
              sub.plan.discountPercent,
            );
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            sendSubscriptionPaymentFailedEmail(sub.customerEmail, {
              planName: sub.plan.name,
              price: unitPrice,
              currency: "CHF",
              manageUrl: `${appUrl}/en/account/subscriptions`,
            }).catch((err) =>
              console.error("Failed to send subscription payment failed email:", err),
            );

            revalidateTag("subscriptions", "minutes");
          }
        }

        // Note: regular order payment failures are handled by payment_intent.payment_failed
        break;
      }

      case "customer.subscription.updated": {
        const stripeSub = event.data.object as unknown as Record<string, unknown>;

        const sub = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.stripeSubscriptionId, stripeSub.id as string),
        });

        if (sub) {
          const updates: Record<string, unknown> = {};

          if (stripeSub.pause_collection) {
            if (sub.status !== "PAUSED") {
              updates.status = "PAUSED";
              updates.pausedAt = new Date();
            }
          } else if (stripeSub.status === "active" && sub.status === "PAUSED") {
            updates.status = "ACTIVE";
            updates.pausedAt = null;
          }

          const cps = stripeSub.current_period_start as number | undefined;
          const cpe = stripeSub.current_period_end as number | undefined;
          if (cps) {
            updates.currentPeriodStart = new Date(cps * 1000);
          }
          if (cpe) {
            updates.currentPeriodEnd = new Date(cpe * 1000);
          }

          if (Object.keys(updates).length > 0) {
            await db
              .update(subscriptions)
              .set(updates)
              .where(eq(subscriptions.id, sub.id));
            revalidateTag("subscriptions", "minutes");
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const deletedSub = event.data.object as unknown as Record<string, unknown>;

        const sub = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.stripeSubscriptionId, deletedSub.id as string),
          with: { plan: true },
        });

        if (sub && sub.status !== "CANCELLED") {
          await db
            .update(subscriptions)
            .set({
              status: "CANCELLED",
              cancelledAt: new Date(),
            })
            .where(eq(subscriptions.id, sub.id));

          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          sendSubscriptionCancelledEmail(sub.customerEmail, {
            planName: sub.plan.name,
            endDate: sub.currentPeriodEnd
              ? sub.currentPeriodEnd.toLocaleDateString("de-CH")
              : new Date().toLocaleDateString("de-CH"),
            shopUrl: appUrl,
          }).catch((err) =>
            console.error("Failed to send subscription cancelled email:", err),
          );

          revalidateTag("subscriptions", "minutes");
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
