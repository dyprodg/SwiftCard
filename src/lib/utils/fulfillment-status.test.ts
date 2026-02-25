import { describe, it, expect } from "vitest";
import { computeFulfillmentStatus, getUnfulfilledQuantities } from "./fulfillment-status";
import type { OrderItem, FulfillmentWithItems } from "@/types";

function makeOrderItem(
  overrides: Partial<OrderItem> & { id: string; quantity: number },
): OrderItem {
  return {
    orderId: "order_1",
    productId: "prod_1",
    variantId: null,
    productName: "Test Product",
    variantName: null,
    unitPrice: 1000,
    total: overrides.quantity * 1000,
    bundleId: null,
    ...overrides,
  };
}

function makeFulfillment(
  items: { orderItemId: string; quantity: number }[],
): FulfillmentWithItems {
  return {
    id: `ful_${Math.random()}`,
    orderId: "order_1",
    trackingNumber: null,
    carrier: null,
    carrierOther: null,
    trackingUrl: null,
    note: null,
    createdBy: "admin",
    createdAt: new Date(),
    items: items.map((i) => ({
      id: `fi_${Math.random()}`,
      fulfillmentId: "ful_1",
      ...i,
    })),
  };
}

describe("computeFulfillmentStatus", () => {
  it("returns UNFULFILLED when no fulfillments exist", () => {
    const items = [makeOrderItem({ id: "i1", quantity: 3 })];
    expect(computeFulfillmentStatus(items, [])).toBe("UNFULFILLED");
  });

  it("returns FULFILLED when all items are fully fulfilled", () => {
    const items = [
      makeOrderItem({ id: "i1", quantity: 2 }),
      makeOrderItem({ id: "i2", quantity: 1 }),
    ];
    const fulfillments = [
      makeFulfillment([
        { orderItemId: "i1", quantity: 2 },
        { orderItemId: "i2", quantity: 1 },
      ]),
    ];
    expect(computeFulfillmentStatus(items, fulfillments)).toBe("FULFILLED");
  });

  it("returns PARTIALLY_FULFILLED when some items are fulfilled", () => {
    const items = [
      makeOrderItem({ id: "i1", quantity: 3 }),
      makeOrderItem({ id: "i2", quantity: 2 }),
    ];
    const fulfillments = [makeFulfillment([{ orderItemId: "i1", quantity: 2 }])];
    expect(computeFulfillmentStatus(items, fulfillments)).toBe("PARTIALLY_FULFILLED");
  });

  it("returns FULFILLED with multiple fulfillments that together cover all items", () => {
    const items = [makeOrderItem({ id: "i1", quantity: 5 })];
    const fulfillments = [
      makeFulfillment([{ orderItemId: "i1", quantity: 3 }]),
      makeFulfillment([{ orderItemId: "i1", quantity: 2 }]),
    ];
    expect(computeFulfillmentStatus(items, fulfillments)).toBe("FULFILLED");
  });

  it("returns PARTIALLY_FULFILLED when one item is fully fulfilled but another is not", () => {
    const items = [
      makeOrderItem({ id: "i1", quantity: 1 }),
      makeOrderItem({ id: "i2", quantity: 3 }),
    ];
    const fulfillments = [
      makeFulfillment([
        { orderItemId: "i1", quantity: 1 },
        { orderItemId: "i2", quantity: 1 },
      ]),
    ];
    expect(computeFulfillmentStatus(items, fulfillments)).toBe("PARTIALLY_FULFILLED");
  });
});

describe("getUnfulfilledQuantities", () => {
  it("returns all items when no fulfillments exist", () => {
    const items = [
      makeOrderItem({ id: "i1", quantity: 3 }),
      makeOrderItem({ id: "i2", quantity: 2 }),
    ];
    const result = getUnfulfilledQuantities(items, []);
    expect(result.get("i1")).toBe(3);
    expect(result.get("i2")).toBe(2);
  });

  it("returns empty map when all items are fulfilled", () => {
    const items = [makeOrderItem({ id: "i1", quantity: 2 })];
    const fulfillments = [makeFulfillment([{ orderItemId: "i1", quantity: 2 }])];
    const result = getUnfulfilledQuantities(items, fulfillments);
    expect(result.size).toBe(0);
  });

  it("returns correct remaining quantities for partial fulfillments", () => {
    const items = [
      makeOrderItem({ id: "i1", quantity: 5 }),
      makeOrderItem({ id: "i2", quantity: 3 }),
    ];
    const fulfillments = [
      makeFulfillment([
        { orderItemId: "i1", quantity: 2 },
        { orderItemId: "i2", quantity: 3 },
      ]),
    ];
    const result = getUnfulfilledQuantities(items, fulfillments);
    expect(result.get("i1")).toBe(3);
    expect(result.has("i2")).toBe(false); // fully fulfilled
  });
});
