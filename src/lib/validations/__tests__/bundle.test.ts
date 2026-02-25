import { describe, it, expect } from "vitest";
import { createBundleSchema, updateBundleSchema } from "../bundle";

describe("createBundleSchema", () => {
  const validInput = {
    name: "Summer Pack",
    bundlePrice: 4990,
    items: [
      { productId: "p1", quantity: 1, position: 0 },
      { productId: "p2", quantity: 1, position: 1 },
    ],
  };

  it("accepts valid input with defaults", () => {
    const result = createBundleSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("DRAFT");
      expect(result.data.featured).toBe(false);
    }
  });

  it("rejects empty name", () => {
    const result = createBundleSchema.safeParse({
      ...validInput,
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative bundle price", () => {
    const result = createBundleSchema.safeParse({
      ...validInput,
      bundlePrice: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects bundle with fewer than 2 items", () => {
    const result = createBundleSchema.safeParse({
      ...validInput,
      items: [{ productId: "p1", quantity: 1, position: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty items array", () => {
    const result = createBundleSchema.safeParse({
      ...validInput,
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts all statuses", () => {
    for (const status of ["DRAFT", "ACTIVE", "ARCHIVED"]) {
      const result = createBundleSchema.safeParse({
        ...validInput,
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const result = createBundleSchema.safeParse({
      ...validInput,
      status: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional translations", () => {
    const result = createBundleSchema.safeParse({
      ...validInput,
      translations: [
        { locale: "de", name: "Sommerpaket", description: "Ein Sommerpaket" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts items with nullable variantId", () => {
    const result = createBundleSchema.safeParse({
      ...validInput,
      items: [
        { productId: "p1", variantId: null, quantity: 1, position: 0 },
        { productId: "p2", variantId: "v1", quantity: 2, position: 1 },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe("updateBundleSchema", () => {
  it("requires id", () => {
    const result = updateBundleSchema.safeParse({ name: "Updated" });
    expect(result.success).toBe(false);
  });

  it("accepts partial updates with id", () => {
    const result = updateBundleSchema.safeParse({
      id: "bundle-1",
      name: "Updated Name",
    });
    expect(result.success).toBe(true);
  });

  it("accepts status-only update", () => {
    const result = updateBundleSchema.safeParse({
      id: "bundle-1",
      status: "ACTIVE",
    });
    expect(result.success).toBe(true);
  });
});
