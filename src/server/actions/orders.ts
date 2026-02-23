"use server";

import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { isValidStatusTransition } from "@/lib/constants/order-status";
import { sendOrderConfirmationEmail, sendShippingNotificationEmail } from "@/lib/resend";
import { buildOrderViewUrl } from "@/lib/utils/order-url";

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: true },
  });

  if (!order) {
    return { error: "Order not found" };
  }

  if (!isValidStatusTransition(order.status, newStatus)) {
    return {
      error: `Cannot transition from ${order.status} to ${newStatus}`,
    };
  }

  const updateData: Record<string, unknown> = {
    status: newStatus,
  };

  // Set timestamps based on status
  if (newStatus === "SHIPPED") {
    updateData.shippedAt = new Date();
  } else if (newStatus === "DELIVERED") {
    updateData.deliveredAt = new Date();
  } else if (newStatus === "CANCELLED") {
    updateData.cancelledAt = new Date();
  }

  await db.update(orders).set(updateData).where(eq(orders.id, orderId));

  // Send emails based on status change
  // Skip shipping email if fulfillments exist — the fulfillment action already sent one with tracking info
  if (newStatus === "SHIPPED") {
    const fullOrder = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: { fulfillments: true },
    });
    if (!fullOrder?.fulfillments?.length) {
      await sendShippingNotificationEmail(order.customerEmail, {
        orderNumber: order.orderNumber,
        shippingName: order.shippingName,
      }).catch((err) => console.error("Failed to send shipping email:", err));
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);

  return { success: true };
}

export async function addInternalNote(orderId: string, note: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) {
    return { error: "Order not found" };
  }

  const existingNote = order.internalNote || "";
  const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const newNote = existingNote
    ? `${existingNote}\n[${timestamp}] ${note}`
    : `[${timestamp}] ${note}`;

  await db.update(orders).set({ internalNote: newNote }).where(eq(orders.id, orderId));

  revalidatePath(`/admin/orders/${orderId}`);

  return { success: true };
}

/**
 * Called from Stripe webhook when payment succeeds.
 * Sends order confirmation email.
 */
export async function handlePaymentSuccess(orderId: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: true },
  });

  if (!order) return;

  const orderViewUrl = buildOrderViewUrl(order.id, order.guestAccessToken, "en");

  await sendOrderConfirmationEmail(order.customerEmail, {
    orderNumber: order.orderNumber,
    items: order.items.map((item) => ({
      productName: item.productName,
      variantName: item.variantName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    })),
    subtotal: order.subtotal,
    tax: order.tax,
    shipping: order.shipping,
    total: order.total,
    currency: order.currency,
    shippingName: order.shippingName,
    shippingAddress1: order.shippingAddress1,
    shippingAddress2: order.shippingAddress2,
    shippingCity: order.shippingCity,
    shippingZip: order.shippingZip,
    shippingCountry: order.shippingCountry,
    orderViewUrl,
  }).catch((err) => console.error("Failed to send order confirmation email:", err));
}
