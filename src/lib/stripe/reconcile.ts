import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { and, eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe/client";
import { deleteCart } from "@/lib/kv";
import { handlePaymentSuccess } from "@/server/actions/orders";

export type ReconcileResult =
  | { reconciled: true; orderId: string; paymentStatus: "PAID" }
  | { reconciled: false; reason: string };

/**
 * Checks Stripe for the real payment status and updates the DB if needed.
 * Idempotent — safe to call multiple times for the same order.
 */
export async function reconcileOrderWithStripe(
  orderId: string,
): Promise<ReconcileResult> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) {
    return { reconciled: false, reason: "Order not found" };
  }

  // Already resolved — nothing to do
  if (order.paymentStatus !== "PENDING") {
    return { reconciled: false, reason: `Already ${order.paymentStatus}` };
  }

  if (!order.stripePaymentIntentId) {
    return { reconciled: false, reason: "No PaymentIntent on order" };
  }

  // Ask Stripe for ground truth
  const pi = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);

  if (pi.status !== "succeeded") {
    return { reconciled: false, reason: `Stripe status: ${pi.status}` };
  }

  // Atomically update only if still PENDING and PI matches (optimistic lock)
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
        eq(orders.paymentStatus, "PENDING"),
        eq(orders.stripePaymentIntentId, pi.id),
      ),
    )
    .returning();

  if (!updated) {
    // Another process already reconciled — that's fine
    return { reconciled: false, reason: "Already reconciled by another process" };
  }

  // Clear cart if we have the cartId in PI metadata
  const cartId = pi.metadata.cartId;
  if (cartId) {
    await deleteCart(cartId).catch(() => {});
  }

  // Send confirmation email
  await handlePaymentSuccess(orderId).catch((err) =>
    console.error("Reconcile: failed to send confirmation email:", err),
  );

  return { reconciled: true, orderId, paymentStatus: "PAID" };
}
