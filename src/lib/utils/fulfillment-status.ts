import type { OrderItem, FulfillmentWithItems } from "@/types";

/**
 * Compute the fulfillment status based on order items and existing fulfillments.
 * Returns "UNFULFILLED" | "PARTIALLY_FULFILLED" | "FULFILLED"
 */
export function computeFulfillmentStatus(
  orderItems: OrderItem[],
  fulfillments: FulfillmentWithItems[],
): "UNFULFILLED" | "PARTIALLY_FULFILLED" | "FULFILLED" {
  if (fulfillments.length === 0) return "UNFULFILLED";

  // Build map: orderItemId → total fulfilled quantity
  const fulfilledQty = new Map<string, number>();
  for (const f of fulfillments) {
    for (const fi of f.items) {
      fulfilledQty.set(fi.orderItemId, (fulfilledQty.get(fi.orderItemId) ?? 0) + fi.quantity);
    }
  }

  let allFulfilled = true;
  for (const item of orderItems) {
    const fulfilled = fulfilledQty.get(item.id) ?? 0;
    if (fulfilled < item.quantity) {
      allFulfilled = false;
      break;
    }
  }

  return allFulfilled ? "FULFILLED" : "PARTIALLY_FULFILLED";
}

/**
 * Get remaining unfulfilled quantity per order item.
 */
export function getUnfulfilledQuantities(
  orderItems: OrderItem[],
  fulfillments: FulfillmentWithItems[],
): Map<string, number> {
  const fulfilledQty = new Map<string, number>();
  for (const f of fulfillments) {
    for (const fi of f.items) {
      fulfilledQty.set(fi.orderItemId, (fulfilledQty.get(fi.orderItemId) ?? 0) + fi.quantity);
    }
  }

  const remaining = new Map<string, number>();
  for (const item of orderItems) {
    const fulfilled = fulfilledQty.get(item.id) ?? 0;
    const rem = item.quantity - fulfilled;
    if (rem > 0) {
      remaining.set(item.id, rem);
    }
  }
  return remaining;
}
