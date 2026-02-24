"use server";

import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { isValidStatusTransition } from "@/lib/constants/order-status";
import { sendOrderConfirmationEmail, sendShippingNotificationEmail } from "@/lib/resend";
import { buildOrderViewUrl } from "@/lib/utils/order-url";
import { logOrderEvent } from "@/lib/utils/order-events";
import {
  editShippingAddressSchema,
  editCustomerNoteSchema,
  bulkStatusUpdateSchema,
  type EditShippingAddressInput,
  type EditCustomerNoteInput,
  type BulkStatusUpdateInput,
} from "@/lib/validations/order-edit";

async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") throw new Error("Unauthorized");
  return userId;
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const adminUserId = await requireAdmin();

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

  // Log event
  await logOrderEvent({
    orderId,
    type: "STATUS_CHANGED",
    data: { from: order.status, to: newStatus },
    createdBy: adminUserId,
  });

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
  const adminUserId = await requireAdmin();

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

  // Log event
  await logOrderEvent({
    orderId,
    type: "INTERNAL_NOTE_ADDED",
    data: { note },
    createdBy: adminUserId,
  });

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

export async function editShippingAddress(input: EditShippingAddressInput) {
  const adminUserId = await requireAdmin();
  const data = editShippingAddressSchema.parse(input);

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, data.orderId),
  });

  if (!order) {
    return { error: "Order not found" };
  }

  if (order.fulfillmentStatus !== "UNFULFILLED") {
    return { error: "Cannot edit shipping address after fulfillment has started" };
  }

  const before = {
    shippingName: order.shippingName,
    shippingAddress1: order.shippingAddress1,
    shippingAddress2: order.shippingAddress2,
    shippingCity: order.shippingCity,
    shippingZip: order.shippingZip,
    shippingCountry: order.shippingCountry,
  };

  await db
    .update(orders)
    .set({
      shippingName: data.shippingName,
      shippingAddress1: data.shippingAddress1,
      shippingAddress2: data.shippingAddress2 || null,
      shippingCity: data.shippingCity,
      shippingZip: data.shippingZip,
      shippingCountry: data.shippingCountry,
    })
    .where(eq(orders.id, data.orderId));

  await logOrderEvent({
    orderId: data.orderId,
    type: "SHIPPING_ADDRESS_EDITED",
    data: {
      before,
      after: {
        shippingName: data.shippingName,
        shippingAddress1: data.shippingAddress1,
        shippingAddress2: data.shippingAddress2 || null,
        shippingCity: data.shippingCity,
        shippingZip: data.shippingZip,
        shippingCountry: data.shippingCountry,
      },
    },
    createdBy: adminUserId,
  });

  revalidatePath(`/admin/orders/${data.orderId}`);

  return { success: true };
}

export async function editCustomerNote(input: EditCustomerNoteInput) {
  const adminUserId = await requireAdmin();
  const data = editCustomerNoteSchema.parse(input);

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, data.orderId),
  });

  if (!order) {
    return { error: "Order not found" };
  }

  if (order.fulfillmentStatus !== "UNFULFILLED") {
    return { error: "Cannot edit customer note after fulfillment has started" };
  }

  const before = order.customerNote;

  await db
    .update(orders)
    .set({ customerNote: data.customerNote || null })
    .where(eq(orders.id, data.orderId));

  await logOrderEvent({
    orderId: data.orderId,
    type: "CUSTOMER_NOTE_EDITED",
    data: { before, after: data.customerNote || null },
    createdBy: adminUserId,
  });

  revalidatePath(`/admin/orders/${data.orderId}`);

  return { success: true };
}

export async function bulkUpdateOrderStatus(input: BulkStatusUpdateInput) {
  const adminUserId = await requireAdmin();
  const data = bulkStatusUpdateSchema.parse(input);

  const targetOrders = await db
    .select({ id: orders.id, status: orders.status, orderNumber: orders.orderNumber })
    .from(orders)
    .where(inArray(orders.id, data.orderIds));

  const results: { updated: string[]; errors: { orderId: string; error: string }[] } = {
    updated: [],
    errors: [],
  };

  for (const order of targetOrders) {
    if (!isValidStatusTransition(order.status, data.newStatus)) {
      results.errors.push({
        orderId: order.id,
        error: `${order.orderNumber}: Cannot transition from ${order.status} to ${data.newStatus}`,
      });
      continue;
    }

    const updateData: Record<string, unknown> = { status: data.newStatus };
    if (data.newStatus === "SHIPPED") updateData.shippedAt = new Date();
    else if (data.newStatus === "DELIVERED") updateData.deliveredAt = new Date();
    else if (data.newStatus === "CANCELLED") updateData.cancelledAt = new Date();

    await db.update(orders).set(updateData).where(eq(orders.id, order.id));

    await logOrderEvent({
      orderId: order.id,
      type: "STATUS_CHANGED",
      data: { from: order.status, to: data.newStatus },
      createdBy: adminUserId,
    });

    results.updated.push(order.id);
  }

  // Check for IDs not found in DB
  const foundIds = new Set(targetOrders.map((o) => o.id));
  for (const id of data.orderIds) {
    if (!foundIds.has(id)) {
      results.errors.push({ orderId: id, error: "Order not found" });
    }
  }

  revalidatePath("/admin/orders");

  return results;
}
