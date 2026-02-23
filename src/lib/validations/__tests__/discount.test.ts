import { describe, it, expect } from "vitest";
import { discountFormSchema } from "../discount";

describe("discountFormSchema", () => {
  const validManual = {
    name: "Test Discount",
    description: "",
    type: "PERCENTAGE" as const,
    value: 20,
    automatic: false,
    code: "TEST20",
    active: true,
    productIds: [] as string[],
    categoryIds: [] as string[],
  };

  const validAutomatic = {
    name: "Auto Discount",
    description: "",
    type: "FIXED" as const,
    value: 1000,
    automatic: true,
    code: "",
    active: true,
    productIds: [] as string[],
    categoryIds: [] as string[],
  };

  it("accepts valid manual discount", () => {
    const result = discountFormSchema.safeParse(validManual);
    expect(result.success).toBe(true);
  });

  it("accepts valid automatic discount", () => {
    const result = discountFormSchema.safeParse(validAutomatic);
    expect(result.success).toBe(true);
  });

  it("rejects automatic discount with code", () => {
    const result = discountFormSchema.safeParse({
      ...validAutomatic,
      code: "SHOULDNT_HAVE",
    });
    expect(result.success).toBe(false);
  });

  it("rejects manual discount without code", () => {
    const result = discountFormSchema.safeParse({
      ...validManual,
      code: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects percentage over 100% (in basis points)", () => {
    // The form schema checks value in basis points range 1-10000
    const result = discountFormSchema.safeParse({
      ...validManual,
      type: "PERCENTAGE",
      value: 10001, // over 10000 basis points (100%)
    });
    expect(result.success).toBe(false);
  });

  it("accepts percentage at 100% boundary", () => {
    const result = discountFormSchema.safeParse({
      ...validManual,
      type: "PERCENTAGE",
      value: 10000, // exactly 100%
    });
    expect(result.success).toBe(true);
  });

  it("accepts free shipping with zero value", () => {
    const result = discountFormSchema.safeParse({
      ...validAutomatic,
      type: "FREE_SHIPPING",
      value: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects fixed discount with value 0", () => {
    const result = discountFormSchema.safeParse({
      ...validManual,
      type: "FIXED",
      value: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = discountFormSchema.safeParse({
      ...validManual,
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = discountFormSchema.safeParse({
      ...validManual,
      description: "A test",
      minOrderAmount: 5000,
      maxUses: 100,
      maxUsesPerCustomer: 1,
      startsAt: "2026-01-01T00:00",
      expiresAt: "2026-12-31T23:59",
      productIds: ["p1", "p2"],
      categoryIds: ["c1"],
    });
    expect(result.success).toBe(true);
  });
});
