"use server";

import { db } from "@/db";
import { returns, returnItems } from "@/db/schema/returns";
import { orders, orderItems, orderRefunds, orderRefundItems } from "@/db/schema/orders";
import { productVariants } from "@/db/schema/products";
import { eq, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { stripe } from "@/lib/stripe/client";
import {
  createReturnSchema,
  approveReturnSchema,
  rejectReturnSchema,
  receiveReturnSchema,
  refundReturnSchema,
  type CreateReturnInput,
  type ApproveReturnInput,
  type RejectReturnInput,
  type ReceiveReturnInput,
  type RefundReturnInput,
} from "@/lib/validations/return";
import { canRequestReturn, getReturnedQuantities } from "@/server/queries/returns";
import { logOrderEvent, logOrderEventTx } from "@/lib/utils/order-events";
import { buildOrderViewUrl } from "@/lib/utils/order-url";
import {
  sendReturnApprovedEmail,
  sendReturnRejectedEmail,
  sendReturnReceivedEmail,
  sendRefundNotificationEmail,
} from "@/lib/resend";
import { updateEdgeConfig } from "@/lib/edge-config-write";
import { updateTag } from "next/cache";

async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") throw new Error("Unauthorized");
  return userId;
}

function mapReturnReasonToRefundReason(reason: string): "CUSTOMER_REQUEST" | "DAMAGED" {
  if (reason === "DEFECTIVE") return "DAMAGED";
  return "CUSTOMER_REQUEST";
}

// ── Customer Actions ──

export async function requestReturn(input: CreateReturnInput) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  // Get user email for ownership check
  const { currentUser } = await import("@clerk/nextjs/server");
  const user = await currentUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress;

  const data = createReturnSchema.parse(input);

  // Check eligibility
  const eligibility = await canRequestReturn(data.orderId, {
    customerId: userId,
    customerEmail: userEmail,
  });
  if (!eligibility.eligible) {
    return { error: eligibility.reason };
  }

  // Fetch order with items
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, data.orderId),
    with: { items: true },
  });

  if (!order) return { error: "ORDER_NOT_FOUND" };

  // Get already-returned quantities
  const returnedQty = await getReturnedQuantities(data.orderId);

  // Validate item quantities
  for (const item of data.items) {
    const orderItem = order.items.find((i) => i.id === item.orderItemId);
    if (!orderItem) {
      return { error: `Order item ${item.orderItemId} not found` };
    }
    const alreadyReturned = returnedQty[item.orderItemId] ?? 0;
    if (item.quantity > orderItem.quantity - alreadyReturned) {
      return {
        error: `Return quantity for "${orderItem.productName}" exceeds available quantity`,
      };
    }
  }

  // Create return
  const [newReturn] = await db
    .insert(returns)
    .values({
      orderId: data.orderId,
      customerId: userId,
      customerEmail: order.customerEmail,
      reason: data.reason,
      note: data.note ?? null,
    })
    .returning();

  // Create return items
  await db.insert(returnItems).values(
    data.items.map((item) => ({
      returnId: newReturn.id,
      orderItemId: item.orderItemId,
      quantity: item.quantity,
      reason: item.reason ?? null,
    })),
  );

  // Log event
  await logOrderEvent({
    orderId: data.orderId,
    type: "RETURN_REQUESTED",
    data: {
      returnId: newReturn.id,
      reason: data.reason,
      itemCount: data.items.length,
    },
    createdBy: userId,
  });

  revalidatePath(`/order/${data.orderId}`);

  return { success: true, returnId: newReturn.id };
}

// ── Admin Actions ──

export async function approveReturn(input: ApproveReturnInput) {
  const adminUserId = await requireAdmin();
  const data = approveReturnSchema.parse(input);

  const returnRecord = await db.query.returns.findFirst({
    where: eq(returns.id, data.returnId),
    with: {
      items: true,
      order: { with: { items: true } },
    },
  });

  if (!returnRecord) return { error: "Return not found" };
  if (returnRecord.status !== "REQUESTED")
    return { error: "Return is not in REQUESTED status" };

  await db
    .update(returns)
    .set({
      status: "APPROVED",
      adminNote: data.adminNote ?? returnRecord.adminNote,
      approvedAt: new Date(),
    })
    .where(eq(returns.id, data.returnId));

  await logOrderEvent({
    orderId: returnRecord.orderId,
    type: "RETURN_APPROVED",
    data: { returnId: data.returnId },
    createdBy: adminUserId,
  });

  // Send shipping instructions email
  const order = returnRecord.order;
  const itemsForEmail = returnRecord.items.map((ri) => {
    const oi = order.items.find((i) => i.id === ri.orderItemId)!;
    return {
      productName: oi.productName,
      variantName: oi.variantName,
      quantity: ri.quantity,
    };
  });

  sendReturnApprovedEmail(returnRecord.customerEmail, {
    orderNumber: order.orderNumber,
    items: itemsForEmail,
    orderViewUrl: buildOrderViewUrl(order.id, order.guestAccessToken, "en"),
  }).catch((err) => console.error("Failed to send return approved email:", err));

  revalidatePath("/admin/returns");
  revalidatePath(`/admin/returns/${data.returnId}`);

  return { success: true };
}

export async function rejectReturn(input: RejectReturnInput) {
  const adminUserId = await requireAdmin();
  const data = rejectReturnSchema.parse(input);

  const returnRecord = await db.query.returns.findFirst({
    where: eq(returns.id, data.returnId),
    with: { order: { columns: { id: true, orderNumber: true, guestAccessToken: true } } },
  });

  if (!returnRecord) return { error: "Return not found" };
  if (returnRecord.status !== "REQUESTED")
    return { error: "Return is not in REQUESTED status" };

  await db
    .update(returns)
    .set({
      status: "REJECTED",
      adminNote: data.adminNote,
      rejectedAt: new Date(),
    })
    .where(eq(returns.id, data.returnId));

  await logOrderEvent({
    orderId: returnRecord.orderId,
    type: "RETURN_REJECTED",
    data: { returnId: data.returnId, reason: data.adminNote },
    createdBy: adminUserId,
  });

  // Send rejection email
  sendReturnRejectedEmail(returnRecord.customerEmail, {
    orderNumber: returnRecord.order.orderNumber,
    rejectionReason: data.adminNote,
    orderViewUrl: buildOrderViewUrl(
      returnRecord.order.id,
      returnRecord.order.guestAccessToken,
      "en",
    ),
  }).catch((err) => console.error("Failed to send return rejected email:", err));

  revalidatePath("/admin/returns");
  revalidatePath(`/admin/returns/${data.returnId}`);

  return { success: true };
}

export async function markReturnReceived(input: ReceiveReturnInput) {
  const adminUserId = await requireAdmin();
  const data = receiveReturnSchema.parse(input);

  const returnRecord = await db.query.returns.findFirst({
    where: eq(returns.id, data.returnId),
    with: { order: { columns: { id: true, orderNumber: true, guestAccessToken: true } } },
  });

  if (!returnRecord) return { error: "Return not found" };
  if (returnRecord.status !== "APPROVED")
    return { error: "Return is not in APPROVED status" };

  await db
    .update(returns)
    .set({
      status: "RECEIVED",
      adminNote: data.adminNote ?? returnRecord.adminNote,
      receivedAt: new Date(),
    })
    .where(eq(returns.id, data.returnId));

  await logOrderEvent({
    orderId: returnRecord.orderId,
    type: "RETURN_RECEIVED",
    data: { returnId: data.returnId },
    createdBy: adminUserId,
  });

  // Send received confirmation email
  sendReturnReceivedEmail(returnRecord.customerEmail, {
    orderNumber: returnRecord.order.orderNumber,
    orderViewUrl: buildOrderViewUrl(
      returnRecord.order.id,
      returnRecord.order.guestAccessToken,
      "en",
    ),
  }).catch((err) => console.error("Failed to send return received email:", err));

  revalidatePath("/admin/returns");
  revalidatePath(`/admin/returns/${data.returnId}`);

  return { success: true };
}

export async function refundReturn(input: RefundReturnInput) {
  const adminUserId = await requireAdmin();
  const data = refundReturnSchema.parse(input);

  const returnRecord = await db.query.returns.findFirst({
    where: eq(returns.id, data.returnId),
    with: {
      items: true,
      order: {
        with: {
          items: true,
          refunds: { with: { items: true } },
        },
      },
    },
  });

  if (!returnRecord) return { error: "Return not found" };
  if (returnRecord.status !== "RECEIVED")
    return { error: "Return is not in RECEIVED status" };

  const order = returnRecord.order;

  if (!order.stripePaymentIntentId) {
    return { error: "No Stripe payment found for this order" };
  }

  // Calculate refund amount from return items
  const refundItems: { orderItemId: string; quantity: number; amount: number }[] = [];
  let totalRefundAmount = 0;

  for (const ri of returnRecord.items) {
    const oi = order.items.find((i) => i.id === ri.orderItemId);
    if (!oi) continue;
    const amount = oi.unitPrice * ri.quantity;
    refundItems.push({
      orderItemId: ri.orderItemId,
      quantity: ri.quantity,
      amount,
    });
    totalRefundAmount += amount;
  }

  if (totalRefundAmount <= 0) {
    return { error: "Refund amount must be greater than zero" };
  }

  const remainingRefundable = order.total - order.totalRefunded;
  if (totalRefundAmount > remainingRefundable) {
    totalRefundAmount = remainingRefundable;
  }

  // Create Stripe refund
  let stripeRefund;
  try {
    stripeRefund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      amount: totalRefundAmount,
      reason: "requested_by_customer",
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        returnId: returnRecord.id,
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
      // Re-read totalRefunded for race safety
      const [currentOrder] = await tx
        .select({ totalRefunded: orders.totalRefunded, total: orders.total })
        .from(orders)
        .where(eq(orders.id, order.id));

      const currentRemaining = currentOrder.total - currentOrder.totalRefunded;
      const safeAmount = Math.min(totalRefundAmount, currentRemaining);
      const newTotalRefunded = currentOrder.totalRefunded + safeAmount;
      const fullyRefunded = newTotalRefunded >= currentOrder.total;

      // Insert refund record
      const [refund] = await tx
        .insert(orderRefunds)
        .values({
          orderId: order.id,
          stripeRefundId: stripeRefund.id,
          amount: safeAmount,
          currency: order.currency,
          reason: mapReturnReasonToRefundReason(returnRecord.reason),
          note: `Return #${returnRecord.id}`,
          isFullRefund: fullyRefunded,
          stockRestored: data.restoreStock,
          createdBy: adminUserId,
        })
        .returning();

      // Insert refund items
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

      // Update order totals + payment status
      const updateData: Record<string, unknown> = {
        totalRefunded: newTotalRefunded,
        paymentStatus: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED",
      };
      if (fullyRefunded) {
        updateData.status = "REFUNDED";
      }
      await tx.update(orders).set(updateData).where(eq(orders.id, order.id));

      // Restore stock if requested
      if (data.restoreStock) {
        for (const ri of refundItems) {
          const oi = order.items.find((i) => i.id === ri.orderItemId);
          if (oi?.variantId) {
            await tx
              .update(productVariants)
              .set({
                stock: sql`${productVariants.stock} + ${ri.quantity}`,
              })
              .where(eq(productVariants.id, oi.variantId));
          }
        }
      }

      // Update return record
      await tx
        .update(returns)
        .set({
          status: "REFUNDED",
          refundId: refund.id,
          refundedAt: new Date(),
          adminNote: data.adminNote ?? returnRecord.adminNote,
        })
        .where(eq(returns.id, data.returnId));

      // Log events
      await logOrderEventTx(tx, {
        orderId: order.id,
        type: "RETURN_REFUNDED",
        data: {
          returnId: returnRecord.id,
          refundId: refund.id,
          amount: safeAmount,
        },
        createdBy: adminUserId,
      });

      await logOrderEventTx(tx, {
        orderId: order.id,
        type: "REFUND_CREATED",
        data: {
          refundId: refund.id,
          stripeRefundId: stripeRefund.id,
          amount: safeAmount,
          type: "partial",
          reason: mapReturnReasonToRefundReason(returnRecord.reason),
          fullyRefunded,
          fromReturn: returnRecord.id,
        },
        createdBy: adminUserId,
      });
    });
  } catch (err) {
    console.error("Refund DB transaction failed:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to record refund",
    };
  }

  // Send refund notification email
  const orderViewUrl = buildOrderViewUrl(order.id, order.guestAccessToken, "en");
  sendRefundNotificationEmail(order.customerEmail, {
    orderNumber: order.orderNumber,
    refundAmount: totalRefundAmount,
    currency: order.currency,
    reason: mapReturnReasonToRefundReason(returnRecord.reason),
    isFullRefund: totalRefundAmount >= remainingRefundable,
    items: refundItems.map((ri) => {
      const oi = order.items.find((i) => i.id === ri.orderItemId)!;
      return {
        productName: oi.productName,
        variantName: oi.variantName,
        quantity: ri.quantity,
        amount: ri.amount,
      };
    }),
    orderViewUrl,
  }).catch((err) => console.error("Failed to send refund email:", err));

  revalidatePath("/admin/returns");
  revalidatePath(`/admin/returns/${data.returnId}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.id}`);

  return { success: true };
}

export async function updateReturnSettings(input: {
  returnWindowDays: number;
  enabled: boolean;
}) {
  await requireAdmin();

  const returnWindowDays = Math.min(365, Math.max(1, Math.round(input.returnWindowDays)));

  await updateEdgeConfig([
    { key: "returnSettings", value: { returnWindowDays, enabled: input.enabled } },
  ]);

  updateTag("return-settings");
  revalidatePath("/", "layout");
}
