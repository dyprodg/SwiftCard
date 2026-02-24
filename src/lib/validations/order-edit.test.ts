import { describe, it, expect } from "vitest";
import {
  editShippingAddressSchema,
  editCustomerNoteSchema,
  bulkStatusUpdateSchema,
} from "./order-edit";

function omit<T extends Record<string, unknown>>(obj: T, key: keyof T) {
  const copy = { ...obj };
  delete copy[key];
  return copy;
}

describe("editShippingAddressSchema", () => {
  const validInput = {
    orderId: "order_123",
    shippingName: "John Doe",
    shippingAddress1: "Bahnhofstrasse 1",
    shippingAddress2: null as string | null,
    shippingCity: "Zurich",
    shippingZip: "8001",
    shippingCountry: "CH",
  };

  it("accepts valid input", () => {
    const result = editShippingAddressSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts valid input with address2", () => {
    const result = editShippingAddressSchema.safeParse({
      ...validInput,
      shippingAddress2: "Apt 3B",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid input without address2", () => {
    const result = editShippingAddressSchema.safeParse(
      omit(validInput, "shippingAddress2"),
    );
    expect(result.success).toBe(true);
  });

  it("rejects missing orderId", () => {
    const result = editShippingAddressSchema.safeParse(omit(validInput, "orderId"));
    expect(result.success).toBe(false);
  });

  it("rejects empty orderId", () => {
    const result = editShippingAddressSchema.safeParse({ ...validInput, orderId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing shippingName", () => {
    const result = editShippingAddressSchema.safeParse(omit(validInput, "shippingName"));
    expect(result.success).toBe(false);
  });

  it("rejects empty shippingName", () => {
    const result = editShippingAddressSchema.safeParse({
      ...validInput,
      shippingName: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing shippingAddress1", () => {
    const result = editShippingAddressSchema.safeParse(
      omit(validInput, "shippingAddress1"),
    );
    expect(result.success).toBe(false);
  });

  it("rejects missing shippingCity", () => {
    const result = editShippingAddressSchema.safeParse(omit(validInput, "shippingCity"));
    expect(result.success).toBe(false);
  });

  it("rejects missing shippingZip", () => {
    const result = editShippingAddressSchema.safeParse(omit(validInput, "shippingZip"));
    expect(result.success).toBe(false);
  });

  it("rejects missing shippingCountry", () => {
    const result = editShippingAddressSchema.safeParse(
      omit(validInput, "shippingCountry"),
    );
    expect(result.success).toBe(false);
  });
});

describe("editCustomerNoteSchema", () => {
  it("accepts valid input", () => {
    const result = editCustomerNoteSchema.safeParse({
      orderId: "order_123",
      customerNote: "Please leave at the door",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null customerNote", () => {
    const result = editCustomerNoteSchema.safeParse({
      orderId: "order_123",
      customerNote: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty customerNote", () => {
    const result = editCustomerNoteSchema.safeParse({
      orderId: "order_123",
      customerNote: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts missing customerNote", () => {
    const result = editCustomerNoteSchema.safeParse({
      orderId: "order_123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing orderId", () => {
    const result = editCustomerNoteSchema.safeParse({
      customerNote: "test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects note exceeding 2000 chars", () => {
    const result = editCustomerNoteSchema.safeParse({
      orderId: "order_123",
      customerNote: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts note at exactly 2000 chars", () => {
    const result = editCustomerNoteSchema.safeParse({
      orderId: "order_123",
      customerNote: "a".repeat(2000),
    });
    expect(result.success).toBe(true);
  });
});

describe("bulkStatusUpdateSchema", () => {
  it("accepts valid input", () => {
    const result = bulkStatusUpdateSchema.safeParse({
      orderIds: ["order_1", "order_2"],
      newStatus: "CONFIRMED",
    });
    expect(result.success).toBe(true);
  });

  it("accepts single order", () => {
    const result = bulkStatusUpdateSchema.safeParse({
      orderIds: ["order_1"],
      newStatus: "SHIPPED",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty orderIds", () => {
    const result = bulkStatusUpdateSchema.safeParse({
      orderIds: [],
      newStatus: "CONFIRMED",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing orderIds", () => {
    const result = bulkStatusUpdateSchema.safeParse({
      newStatus: "CONFIRMED",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = bulkStatusUpdateSchema.safeParse({
      orderIds: ["order_1"],
      newStatus: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing newStatus", () => {
    const result = bulkStatusUpdateSchema.safeParse({
      orderIds: ["order_1"],
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid statuses", () => {
    const statuses = [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "REFUNDED",
    ];
    for (const status of statuses) {
      const result = bulkStatusUpdateSchema.safeParse({
        orderIds: ["order_1"],
        newStatus: status,
      });
      expect(result.success).toBe(true);
    }
  });
});
