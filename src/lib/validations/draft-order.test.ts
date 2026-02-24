import { describe, it, expect } from "vitest";
import {
  createDraftOrderSchema,
  updateDraftOrderSchema,
  sendPaymentLinkSchema,
  draftOrderItemSchema,
} from "./draft-order";

// ---- Draft Order Item ----

describe("draftOrderItemSchema", () => {
  it("accepts a valid item with variant", () => {
    const result = draftOrderItemSchema.safeParse({
      productId: "prod_1",
      variantId: "var_1",
      quantity: 2,
      productName: "Test Product",
      variantName: "Size M",
      unitPrice: 990,
      categoryId: "cat_1",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid item without variant", () => {
    const result = draftOrderItemSchema.safeParse({
      productId: "prod_1",
      variantId: null,
      quantity: 1,
      productName: "Simple Product",
      variantName: null,
      unitPrice: 500,
      categoryId: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero quantity", () => {
    const result = draftOrderItemSchema.safeParse({
      productId: "prod_1",
      variantId: null,
      quantity: 0,
      productName: "Test",
      variantName: null,
      unitPrice: 500,
      categoryId: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative quantity", () => {
    const result = draftOrderItemSchema.safeParse({
      productId: "prod_1",
      variantId: null,
      quantity: -1,
      productName: "Test",
      variantName: null,
      unitPrice: 500,
      categoryId: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative unit price", () => {
    const result = draftOrderItemSchema.safeParse({
      productId: "prod_1",
      variantId: null,
      quantity: 1,
      productName: "Test",
      variantName: null,
      unitPrice: -100,
      categoryId: null,
    });
    expect(result.success).toBe(false);
  });
});

// ---- Create Draft Order ----

describe("createDraftOrderSchema", () => {
  const validInput = {
    items: [
      {
        productId: "prod_1",
        variantId: "var_1",
        quantity: 1,
        productName: "Product A",
        variantName: "Size M",
        unitPrice: 1990,
        categoryId: null,
      },
    ],
    customerEmail: "customer@example.com",
    shippingName: "John Doe",
    shippingAddress1: "Main Street 1",
    shippingCity: "Zurich",
    shippingZip: "8001",
    shippingCountry: "CH",
  };

  it("accepts valid input", () => {
    const result = createDraftOrderSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts input with optional fields", () => {
    const result = createDraftOrderSchema.safeParse({
      ...validInput,
      phone: "+41 79 123 45 67",
      couponCode: "SAVE10",
      internalNote: "Phone order from regular customer",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty items", () => {
    const result = createDraftOrderSchema.safeParse({
      ...validInput,
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = createDraftOrderSchema.safeParse({
      ...validInput,
      customerEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short shipping name", () => {
    const result = createDraftOrderSchema.safeParse({
      ...validInput,
      shippingName: "A",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing country", () => {
    const result = createDraftOrderSchema.safeParse({
      ...validInput,
      shippingCountry: "",
    });
    expect(result.success).toBe(false);
  });

  it("defaults phone to empty string", () => {
    const result = createDraftOrderSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe("");
    }
  });

  it("defaults internalNote to empty string", () => {
    const result = createDraftOrderSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.internalNote).toBe("");
    }
  });
});

// ---- Update Draft Order ----

describe("updateDraftOrderSchema", () => {
  it("requires orderId", () => {
    const result = updateDraftOrderSchema.safeParse({
      items: [
        {
          productId: "prod_1",
          variantId: null,
          quantity: 1,
          productName: "Test",
          variantName: null,
          unitPrice: 500,
          categoryId: null,
        },
      ],
      customerEmail: "test@test.com",
      shippingName: "Test User",
      shippingAddress1: "Test Street 1",
      shippingCity: "Bern",
      shippingZip: "3000",
      shippingCountry: "CH",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid update input", () => {
    const result = updateDraftOrderSchema.safeParse({
      orderId: "order_123",
      items: [
        {
          productId: "prod_1",
          variantId: null,
          quantity: 2,
          productName: "Test",
          variantName: null,
          unitPrice: 500,
          categoryId: null,
        },
      ],
      customerEmail: "test@test.com",
      shippingName: "Test User",
      shippingAddress1: "Test Street 1",
      shippingCity: "Bern",
      shippingZip: "3000",
      shippingCountry: "CH",
    });
    expect(result.success).toBe(true);
  });
});

// ---- Send Payment Link ----

describe("sendPaymentLinkSchema", () => {
  it("accepts valid input", () => {
    const result = sendPaymentLinkSchema.safeParse({
      orderId: "order_123",
    });
    expect(result.success).toBe(true);
  });

  it("accepts with custom message", () => {
    const result = sendPaymentLinkSchema.safeParse({
      orderId: "order_123",
      customMessage: "Please complete payment at your convenience.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty orderId", () => {
    const result = sendPaymentLinkSchema.safeParse({
      orderId: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects message over 500 chars", () => {
    const result = sendPaymentLinkSchema.safeParse({
      orderId: "order_123",
      customMessage: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("defaults customMessage to empty string", () => {
    const result = sendPaymentLinkSchema.safeParse({
      orderId: "order_123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customMessage).toBe("");
    }
  });
});
