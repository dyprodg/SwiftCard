import { describe, it, expect } from "vitest";
import { fulfillmentSchema } from "./fulfillment";

describe("fulfillmentSchema", () => {
  const validInput = {
    orderId: "order_123",
    carrier: "POST" as const,
    trackingNumber: "99.12.345678.12345678",
    items: [{ orderItemId: "item_1", quantity: 2 }],
  };

  it("accepts valid input", () => {
    const result = fulfillmentSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts input without carrier", () => {
    const result = fulfillmentSchema.safeParse({
      orderId: "order_123",
      items: [{ orderItemId: "item_1", quantity: 1 }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts input with note", () => {
    const result = fulfillmentSchema.safeParse({
      ...validInput,
      note: "Shipped via express",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty items array", () => {
    const result = fulfillmentSchema.safeParse({
      ...validInput,
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing orderId", () => {
    const result = fulfillmentSchema.safeParse({
      items: [{ orderItemId: "item_1", quantity: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects item with zero quantity", () => {
    const result = fulfillmentSchema.safeParse({
      ...validInput,
      items: [{ orderItemId: "item_1", quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects item with negative quantity", () => {
    const result = fulfillmentSchema.safeParse({
      ...validInput,
      items: [{ orderItemId: "item_1", quantity: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it("requires carrierOther when carrier is OTHER", () => {
    const result = fulfillmentSchema.safeParse({
      ...validInput,
      carrier: "OTHER",
    });
    expect(result.success).toBe(false);
  });

  it("accepts carrier OTHER with carrierOther provided", () => {
    const result = fulfillmentSchema.safeParse({
      ...validInput,
      carrier: "OTHER",
      carrierOther: "FedEx",
    });
    expect(result.success).toBe(true);
  });

  it("rejects carrier OTHER with empty carrierOther", () => {
    const result = fulfillmentSchema.safeParse({
      ...validInput,
      carrier: "OTHER",
      carrierOther: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("accepts multiple items", () => {
    const result = fulfillmentSchema.safeParse({
      ...validInput,
      items: [
        { orderItemId: "item_1", quantity: 2 },
        { orderItemId: "item_2", quantity: 1 },
      ],
    });
    expect(result.success).toBe(true);
  });
});
