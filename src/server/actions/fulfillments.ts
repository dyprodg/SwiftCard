"use server";

import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { fulfillments, fulfillmentItems } from "@/db/schema/fulfillments";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { fulfillmentSchema, type FulfillmentInput } from "@/lib/validations/fulfillment";
import { buildTrackingUrl } from "@/lib/constants/carriers";
import { computeFulfillmentStatus } from "@/lib/utils/fulfillment-status";
import { sendShippingNotificationEmail } from "@/lib/resend";
import { logOrderEventTx } from "@/lib/utils/order-events";
import type { FulfillmentWithItems } from "@/types";

async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") throw new Error("Unauthorized");
  return userId;
}

export async function createFulfillment(input: FulfillmentInput) {
  const adminUserId = await requireAdmin();
  const data = fulfillmentSchema.parse(input);

  // Fetch order with items + existing fulfillments
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, data.orderId),
    with: {
      items: true,
      fulfillments: { with: { items: true } },
    },
  });

  if (!order) {
    return { error: "Order not found" };
  }

  // Validate: not cancelled/refunded
  if (order.status === "CANCELLED" || order.status === "REFUNDED") {
    return { error: "Cannot fulfill a cancelled or refunded order" };
  }

  // Validate: item quantities don't exceed unfulfilled
  const fulfilledQty = new Map<string, number>();
  for (const f of order.fulfillments) {
    for (const fi of f.items) {
      fulfilledQty.set(
        fi.orderItemId,
        (fulfilledQty.get(fi.orderItemId) ?? 0) + fi.quantity,
      );
    }
  }

  for (const item of data.items) {
    const orderItem = order.items.find((oi) => oi.id === item.orderItemId);
    if (!orderItem) {
      return { error: `Order item ${item.orderItemId} not found` };
    }
    const alreadyFulfilled = fulfilledQty.get(item.orderItemId) ?? 0;
    if (item.quantity > orderItem.quantity - alreadyFulfilled) {
      return {
        error: `Fulfillment quantity for "${orderItem.productName}" exceeds unfulfilled quantity`,
      };
    }
  }

  // Compute tracking URL if not manually set
  const trackingUrl =
    data.trackingUrl?.trim() ||
    buildTrackingUrl(data.carrier ?? null, data.trackingNumber ?? null) ||
    null;

  // DB transaction
  try {
    await db.transaction(async (tx) => {
      // Insert fulfillment
      const [fulfillment] = await tx
        .insert(fulfillments)
        .values({
          orderId: data.orderId,
          trackingNumber: data.trackingNumber?.trim() || null,
          carrier: data.carrier ?? null,
          carrierOther:
            data.carrier === "OTHER" ? data.carrierOther?.trim() || null : null,
          trackingUrl,
          note: data.note?.trim() || null,
          createdBy: adminUserId,
        })
        .returning();

      // Insert fulfillment items
      await tx.insert(fulfillmentItems).values(
        data.items.map((item) => ({
          fulfillmentId: fulfillment.id,
          orderItemId: item.orderItemId,
          quantity: item.quantity,
        })),
      );

      // Compute new fulfillment status
      const newFulfillment: FulfillmentWithItems = {
        ...fulfillment,
        items: data.items.map((item) => ({
          id: "",
          fulfillmentId: fulfillment.id,
          orderItemId: item.orderItemId,
          quantity: item.quantity,
        })),
      };
      const allFulfillments = [...order.fulfillments, newFulfillment];
      const newFulfillmentStatus = computeFulfillmentStatus(order.items, allFulfillments);

      // Update order
      const updateData: Record<string, unknown> = {
        fulfillmentStatus: newFulfillmentStatus,
      };

      // Auto-transition to SHIPPED if first fulfillment and order is CONFIRMED/PROCESSING
      if (
        order.fulfillments.length === 0 &&
        (order.status === "CONFIRMED" || order.status === "PROCESSING")
      ) {
        updateData.status = "SHIPPED";
        updateData.shippedAt = new Date();
      }

      await tx.update(orders).set(updateData).where(eq(orders.id, data.orderId));

      // Log fulfillment events
      await logOrderEventTx(tx, {
        orderId: data.orderId,
        type: "FULFILLMENT_CREATED",
        data: {
          fulfillmentId: fulfillment.id,
          carrier: data.carrier ?? null,
          trackingNumber: data.trackingNumber?.trim() || null,
          items: data.items,
        },
        createdBy: adminUserId,
      });

      await logOrderEventTx(tx, {
        orderId: data.orderId,
        type: "FULFILLMENT_STATUS_CHANGED",
        data: {
          from: order.fulfillmentStatus,
          to: newFulfillmentStatus,
        },
        createdBy: adminUserId,
      });

      if (updateData.status) {
        await logOrderEventTx(tx, {
          orderId: data.orderId,
          type: "STATUS_CHANGED",
          data: { from: order.status, to: updateData.status },
          createdBy: adminUserId,
        });
      }
    });
  } catch (err) {
    console.error("Fulfillment DB transaction failed:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to create fulfillment",
    };
  }

  // Fire-and-forget shipping email with tracking info
  sendShippingNotificationEmail(order.customerEmail, {
    orderNumber: order.orderNumber,
    shippingName: order.shippingName,
    trackingNumber: data.trackingNumber?.trim() || undefined,
    trackingUrl: trackingUrl || undefined,
  }).catch((err) => console.error("Failed to send shipping email:", err));

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${data.orderId}`);

  return { success: true };
}
