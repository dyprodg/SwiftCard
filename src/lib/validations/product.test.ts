import { describe, it, expect } from "vitest";
import {
  productFormSchema,
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  createCategorySchema,
} from "./product";

describe("productFormSchema", () => {
  const validProduct = {
    name: "Classic T-Shirt",
    basePrice: 2990,
    status: "ACTIVE" as const,
    featured: false,
  };

  it("accepts valid product", () => {
    const result = productFormSchema.parse(validProduct);
    expect(result.name).toBe("Classic T-Shirt");
  });

  it("rejects empty name", () => {
    const result = productFormSchema.safeParse({ ...validProduct, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = productFormSchema.safeParse({ ...validProduct, basePrice: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer price", () => {
    const result = productFormSchema.safeParse({ ...validProduct, basePrice: 29.99 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = productFormSchema.safeParse({ ...validProduct, status: "DELETED" });
    expect(result.success).toBe(false);
  });

  it("enforces metaTitle max length of 60", () => {
    const result = productFormSchema.safeParse({
      ...validProduct,
      metaTitle: "a".repeat(61),
    });
    expect(result.success).toBe(false);
  });

  it("enforces metaDescription max length of 160", () => {
    const result = productFormSchema.safeParse({
      ...validProduct,
      metaDescription: "a".repeat(161),
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid metaTitle and metaDescription", () => {
    const result = productFormSchema.parse({
      ...validProduct,
      metaTitle: "SEO Title",
      metaDescription: "SEO Description",
    });
    expect(result.metaTitle).toBe("SEO Title");
  });
});

describe("createProductSchema", () => {
  it("defaults status to DRAFT", () => {
    const result = createProductSchema.parse({
      name: "Product",
      basePrice: 1000,
    });
    expect(result.status).toBe("DRAFT");
  });

  it("defaults featured to false", () => {
    const result = createProductSchema.parse({
      name: "Product",
      basePrice: 1000,
    });
    expect(result.featured).toBe(false);
  });
});

describe("updateProductSchema", () => {
  it("requires id", () => {
    const result = updateProductSchema.safeParse({ name: "Updated" });
    expect(result.success).toBe(false);
  });

  it("accepts partial fields with id", () => {
    const result = updateProductSchema.parse({
      id: "prod-1",
      name: "Updated Name",
    });
    expect(result.name).toBe("Updated Name");
    expect(result.basePrice).toBeUndefined();
  });
});

describe("createVariantSchema", () => {
  const validVariant = {
    productId: "prod-1",
    sku: "SKU-001",
  };

  it("defaults priceAdjustment to 0", () => {
    const result = createVariantSchema.parse(validVariant);
    expect(result.priceAdjustment).toBe(0);
  });

  it("defaults stock to 0", () => {
    const result = createVariantSchema.parse(validVariant);
    expect(result.stock).toBe(0);
  });

  it("defaults isAvailable to true", () => {
    const result = createVariantSchema.parse(validVariant);
    expect(result.isAvailable).toBe(true);
  });

  it("rejects empty SKU", () => {
    const result = createVariantSchema.safeParse({ ...validVariant, sku: "" });
    expect(result.success).toBe(false);
  });
});

describe("createCategorySchema", () => {
  it("accepts valid category", () => {
    const result = createCategorySchema.parse({ name: "Clothing" });
    expect(result.name).toBe("Clothing");
  });

  it("rejects empty name", () => {
    const result = createCategorySchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("enforces max length of 100", () => {
    const result = createCategorySchema.safeParse({ name: "a".repeat(101) });
    expect(result.success).toBe(false);
  });
});
