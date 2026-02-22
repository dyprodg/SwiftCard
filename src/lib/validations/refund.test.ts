import { describe, it, expect } from "vitest";
import {
  refundSchema,
  fullRefundSchema,
  partialRefundSchema,
  percentageRefundSchema,
} from "./refund";

describe("fullRefundSchema", () => {
  it("accepts valid full refund", () => {
    const input = {
      type: "full" as const,
      orderId: "order_123",
      reason: "CUSTOMER_REQUEST" as const,
      restoreStock: true,
    };
    expect(fullRefundSchema.parse(input)).toEqual(input);
  });

  it("accepts optional note", () => {
    const input = {
      type: "full" as const,
      orderId: "order_123",
      reason: "DAMAGED" as const,
      note: "Item was defective",
      restoreStock: false,
    };
    expect(fullRefundSchema.parse(input)).toEqual(input);
  });

  it("rejects empty orderId", () => {
    expect(() =>
      fullRefundSchema.parse({
        type: "full",
        orderId: "",
        reason: "OTHER",
        restoreStock: false,
      }),
    ).toThrow();
  });

  it("rejects invalid reason", () => {
    expect(() =>
      fullRefundSchema.parse({
        type: "full",
        orderId: "order_123",
        reason: "INVALID",
        restoreStock: false,
      }),
    ).toThrow();
  });
});

describe("partialRefundSchema", () => {
  it("accepts valid partial refund", () => {
    const input = {
      type: "partial" as const,
      orderId: "order_123",
      reason: "MISSING_ITEM" as const,
      restoreStock: true,
      items: [{ orderItemId: "item_1", quantity: 2, amount: 1000 }],
      totalAmount: 1000,
    };
    expect(partialRefundSchema.parse(input)).toEqual(input);
  });

  it("rejects empty items array", () => {
    expect(() =>
      partialRefundSchema.parse({
        type: "partial",
        orderId: "order_123",
        reason: "OTHER",
        restoreStock: false,
        items: [],
        totalAmount: 1000,
      }),
    ).toThrow();
  });

  it("rejects zero quantity", () => {
    expect(() =>
      partialRefundSchema.parse({
        type: "partial",
        orderId: "order_123",
        reason: "OTHER",
        restoreStock: false,
        items: [{ orderItemId: "item_1", quantity: 0, amount: 1000 }],
        totalAmount: 1000,
      }),
    ).toThrow();
  });

  it("rejects zero amount", () => {
    expect(() =>
      partialRefundSchema.parse({
        type: "partial",
        orderId: "order_123",
        reason: "OTHER",
        restoreStock: false,
        items: [{ orderItemId: "item_1", quantity: 1, amount: 0 }],
        totalAmount: 1000,
      }),
    ).toThrow();
  });

  it("rejects zero totalAmount", () => {
    expect(() =>
      partialRefundSchema.parse({
        type: "partial",
        orderId: "order_123",
        reason: "OTHER",
        restoreStock: false,
        items: [{ orderItemId: "item_1", quantity: 1, amount: 500 }],
        totalAmount: 0,
      }),
    ).toThrow();
  });
});

describe("percentageRefundSchema", () => {
  it("accepts valid percentage refund", () => {
    const input = {
      type: "percentage" as const,
      orderId: "order_123",
      reason: "DAMAGED" as const,
      restoreStock: false,
      items: [{ orderItemId: "item_1", quantity: 1, amount: 500 }],
      percentage: 50,
      totalAmount: 500,
    };
    expect(percentageRefundSchema.parse(input)).toEqual(input);
  });

  it("rejects percentage above 100", () => {
    expect(() =>
      percentageRefundSchema.parse({
        type: "percentage",
        orderId: "order_123",
        reason: "OTHER",
        restoreStock: false,
        items: [{ orderItemId: "item_1", quantity: 1, amount: 500 }],
        percentage: 101,
        totalAmount: 500,
      }),
    ).toThrow();
  });

  it("rejects percentage below 1", () => {
    expect(() =>
      percentageRefundSchema.parse({
        type: "percentage",
        orderId: "order_123",
        reason: "OTHER",
        restoreStock: false,
        items: [{ orderItemId: "item_1", quantity: 1, amount: 500 }],
        percentage: 0,
        totalAmount: 500,
      }),
    ).toThrow();
  });
});

describe("refundSchema (discriminated union)", () => {
  it("accepts full refund type", () => {
    const result = refundSchema.parse({
      type: "full",
      orderId: "order_123",
      reason: "CUSTOMER_REQUEST",
      restoreStock: true,
    });
    expect(result.type).toBe("full");
  });

  it("accepts partial refund type", () => {
    const result = refundSchema.parse({
      type: "partial",
      orderId: "order_123",
      reason: "MISSING_ITEM",
      restoreStock: true,
      items: [{ orderItemId: "item_1", quantity: 1, amount: 500 }],
      totalAmount: 500,
    });
    expect(result.type).toBe("partial");
  });

  it("accepts percentage refund type", () => {
    const result = refundSchema.parse({
      type: "percentage",
      orderId: "order_123",
      reason: "DAMAGED",
      restoreStock: false,
      items: [{ orderItemId: "item_1", quantity: 1, amount: 250 }],
      percentage: 50,
      totalAmount: 250,
    });
    expect(result.type).toBe("percentage");
  });

  it("rejects invalid type", () => {
    expect(() =>
      refundSchema.parse({
        type: "invalid",
        orderId: "order_123",
        reason: "OTHER",
        restoreStock: false,
      }),
    ).toThrow();
  });

  it("accepts all valid reasons", () => {
    const reasons = ["DAMAGED", "MISSING_ITEM", "CUSTOMER_REQUEST", "DUPLICATE", "OTHER"];
    for (const reason of reasons) {
      expect(() =>
        refundSchema.parse({
          type: "full",
          orderId: "order_123",
          reason,
          restoreStock: false,
        }),
      ).not.toThrow();
    }
  });

  it("accepts multiple items in partial refund", () => {
    const result = refundSchema.parse({
      type: "partial",
      orderId: "order_123",
      reason: "CUSTOMER_REQUEST",
      restoreStock: true,
      items: [
        { orderItemId: "item_1", quantity: 2, amount: 1000 },
        { orderItemId: "item_2", quantity: 1, amount: 500 },
      ],
      totalAmount: 1500,
    });
    expect(result.type).toBe("partial");
    if (result.type === "partial") {
      expect(result.items).toHaveLength(2);
    }
  });
});
