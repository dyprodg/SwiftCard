"use server";

import { db } from "@/db";
import { orders, orderRefunds, orderRefundItems } from "@/db/schema/orders";
import { productVariants } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { stripe } from "@/lib/stripe/client";
import { refundSchema, type RefundInput } from "@/lib/validations/refund";
import { sendRefundNotificationEmail } from "@/lib/resend";
import { buildOrderViewUrl } from "@/lib/utils/order-url";

async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") throw new Error("Unauthorized");
  return userId;
}

function mapReasonToStripe(
  reason: string,
): "duplicate" | "fraudulent" | "requested_by_customer" {
  if (reason === "DUPLICATE") return "duplicate";
  return "requested_by_customer";
}

export async function processRefund(input: RefundInput) {
  const adminUserId = await requireAdmin();
  const data = refundSchema.parse(input);

  // Fetch order with items and existing refunds
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, data.orderId),
    with: {
      items: true,
      refunds: { with: { items: true } },
    },
  });

  if (!order) {
    return { error: "Order not found" };
  }

  if (order.paymentStatus !== "PAID" && order.paymentStatus !== "PARTIALLY_REFUNDED") {
    return { error: "Order payment status does not allow refunds" };
  }

  if (!order.stripePaymentIntentId) {
    return { error: "No Stripe payment found for this order" };
  }

  const remainingRefundable = order.total - order.totalRefunded;

  // Calculate refund amount
  let refundAmount: number;
  let isFullRefund: boolean;
  let refundItems: { orderItemId: string; quantity: number; amount: number }[] = [];

  if (data.type === "full") {
    refundAmount = remainingRefundable;
    isFullRefund = true;
  } else {
    // partial or percentage
    refundAmount = data.totalAmount;
    isFullRefund = refundAmount >= remainingRefundable;
    refundItems = data.items;

    // Validate item quantities don't exceed what's available
    for (const refundItem of refundItems) {
      const orderItem = order.items.find((i) => i.id === refundItem.orderItemId);
      if (!orderItem) {
        return { error: `Order item ${refundItem.orderItemId} not found` };
      }

      // Calculate already-refunded quantity for this item across all refunds
      const alreadyRefundedQty = order.refunds.reduce((sum, r) => {
        const ri = r.items.find((i) => i.orderItemId === refundItem.orderItemId);
        return sum + (ri?.quantity ?? 0);
      }, 0);

      if (refundItem.quantity > orderItem.quantity - alreadyRefundedQty) {
        return {
          error: `Refund quantity for "${orderItem.productName}" exceeds available quantity`,
        };
      }
    }
  }

  if (refundAmount <= 0) {
    return { error: "Refund amount must be greater than zero" };
  }

  if (refundAmount > remainingRefundable) {
    return { error: "Refund amount exceeds remaining refundable amount" };
  }

  // Create Stripe refund
  let stripeRefund;
  try {
    stripeRefund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      amount: refundAmount,
      reason: mapReasonToStripe(data.reason),
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        refundType: data.type,
        adminUserId,
      },
    });
  } catch (err) {
    console.error("Stripe refund failed:", err);
    return {
      error: err instanceof Error ? err.message : "Stripe refund failed",
    };
  }

  // DB transaction
  try {
    await db.transaction(async (tx) => {
      // Re-read totalRefunded inside transaction for race condition safety
      const [currentOrder] = await tx
        .select({ totalRefunded: orders.totalRefunded, total: orders.total })
        .from(orders)
        .where(eq(orders.id, data.orderId));

      const currentRemaining = currentOrder.total - currentOrder.totalRefunded;
      if (refundAmount > currentRemaining) {
        throw new Error(
          "Refund amount exceeds remaining refundable amount (concurrent update)",
        );
      }

      const newTotalRefunded = currentOrder.totalRefunded + refundAmount;
      const fullyRefunded = newTotalRefunded >= currentOrder.total;

      // Insert refund record
      const [refund] = await tx
        .insert(orderRefunds)
        .values({
          orderId: data.orderId,
          stripeRefundId: stripeRefund.id,
          amount: refundAmount,
          currency: order.currency,
          reason: data.reason,
          note: data.note ?? null,
          isFullRefund: fullyRefunded,
          stockRestored: data.restoreStock,
          createdBy: adminUserId,
        })
        .returning();

      // Insert refund items (for partial/percentage)
      if (refundItems.length > 0) {
        await tx.insert(orderRefundItems).values(
          refundItems.map((item) => ({
            refundId: refund.id,
            orderItemId: item.orderItemId,
            quantity: item.quantity,
            amount: item.amount,
          })),
        );
      }

      // Update order
      const updateData: Record<string, unknown> = {
        totalRefunded: newTotalRefunded,
        paymentStatus: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED",
      };

      if (fullyRefunded) {
        updateData.status = "REFUNDED";
      }

      await tx.update(orders).set(updateData).where(eq(orders.id, data.orderId));

      // Restore stock if requested
      if (data.restoreStock) {
        if (data.type === "full") {
          // Restore all items
          for (const item of order.items) {
            if (item.variantId) {
              await tx
                .update(productVariants)
                .set({
                  stock: sql`${productVariants.stock} + ${item.quantity}`,
                })
                .where(eq(productVariants.id, item.variantId));
            }
          }
        } else {
          // Restore specific items
          for (const refundItem of refundItems) {
            const orderItem = order.items.find((i) => i.id === refundItem.orderItemId);
            if (orderItem?.variantId) {
              await tx
                .update(productVariants)
                .set({
                  stock: sql`${productVariants.stock} + ${refundItem.quantity}`,
                })
                .where(eq(productVariants.id, orderItem.variantId));
            }
          }
        }
      }
    });
  } catch (err) {
    console.error("Refund DB transaction failed:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to record refund",
    };
  }

  // Send refund notification email (fire-and-forget)
  const orderViewUrl = buildOrderViewUrl(order.id, order.guestAccessToken, "en");
  sendRefundNotificationEmail(order.customerEmail, {
    orderNumber: order.orderNumber,
    refundAmount,
    currency: order.currency,
    reason: data.reason,
    isFullRefund: refundAmount >= remainingRefundable,
    items:
      refundItems.length > 0
        ? refundItems.map((ri) => {
            const oi = order.items.find((i) => i.id === ri.orderItemId)!;
            return {
              productName: oi.productName,
              variantName: oi.variantName,
              quantity: ri.quantity,
              amount: ri.amount,
            };
          })
        : undefined,
    orderViewUrl,
  }).catch((err) => console.error("Failed to send refund email:", err));

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${data.orderId}`);

  return { success: true, refundId: stripeRefund.id };
}
