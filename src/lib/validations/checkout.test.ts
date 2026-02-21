import { describe, it, expect } from "vitest";
import { shippingAddressSchema, checkoutSchema, checkoutFormSchema } from "./checkout";

describe("shippingAddressSchema", () => {
  const validAddress = {
    name: "John Doe",
    address1: "123 Main St",
    city: "Zurich",
    zip: "8001",
    country: "CH",
  };

  it("accepts valid input", () => {
    const result = shippingAddressSchema.parse(validAddress);
    expect(result.name).toBe("John Doe");
    expect(result.address2).toBe("");
  });

  it("trims whitespace", () => {
    const result = shippingAddressSchema.parse({
      ...validAddress,
      name: "  John Doe  ",
      city: "  Zurich  ",
    });
    expect(result.name).toBe("John Doe");
    expect(result.city).toBe("Zurich");
  });

  it("rejects name shorter than 2 chars", () => {
    const result = shippingAddressSchema.safeParse({ ...validAddress, name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects empty address1", () => {
    const result = shippingAddressSchema.safeParse({ ...validAddress, address1: "ab" });
    expect(result.success).toBe(false);
  });

  it("defaults address2 to empty string", () => {
    const result = shippingAddressSchema.parse(validAddress);
    expect(result.address2).toBe("");
  });

  it("rejects country longer than 2 chars", () => {
    const result = shippingAddressSchema.safeParse({ ...validAddress, country: "CHE" });
    expect(result.success).toBe(false);
  });

  it("rejects country shorter than 2 chars", () => {
    const result = shippingAddressSchema.safeParse({ ...validAddress, country: "C" });
    expect(result.success).toBe(false);
  });
});

describe("checkoutSchema", () => {
  const validCheckout = {
    shippingAddress: {
      name: "John Doe",
      address1: "123 Main St",
      city: "Zurich",
      zip: "8001",
      country: "CH",
    },
    customerEmail: "john@example.com",
  };

  it("accepts valid checkout", () => {
    const result = checkoutSchema.parse(validCheckout);
    expect(result.customerEmail).toBe("john@example.com");
    expect(result.customerNote).toBe("");
  });

  it("rejects invalid email", () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      customerEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects customerNote exceeding 500 chars", () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      customerNote: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("defaults customerNote to empty string", () => {
    const result = checkoutSchema.parse(validCheckout);
    expect(result.customerNote).toBe("");
  });
});

describe("checkoutFormSchema", () => {
  const validForm = {
    name: "John Doe",
    email: "john@example.com",
    address1: "123 Main St",
    city: "Zurich",
    zip: "8001",
    country: "CH",
  };

  it("accepts valid form", () => {
    const result = checkoutFormSchema.parse(validForm);
    expect(result.name).toBe("John Doe");
  });

  it("trims form fields", () => {
    const result = checkoutFormSchema.parse({
      ...validForm,
      name: "  John Doe  ",
      address1: "  123 Main St  ",
    });
    expect(result.name).toBe("John Doe");
    expect(result.address1).toBe("123 Main St");
  });

  it("rejects invalid email", () => {
    const result = checkoutFormSchema.safeParse({
      ...validForm,
      email: "bad",
    });
    expect(result.success).toBe(false);
  });
});
