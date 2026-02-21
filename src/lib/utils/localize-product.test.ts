import { describe, it, expect } from "vitest";
import { localizeProduct, localizeProducts } from "./localize-product";

describe("localizeProduct", () => {
  const baseProduct = {
    id: "1",
    name: "Base Name",
    description: "Base Description",
    translations: [
      { locale: "de", name: "German Name", description: "German Desc" },
      { locale: "en", name: "English Name", description: "English Desc" },
    ],
  };

  it("returns translated name and description for matching locale", () => {
    const result = localizeProduct(baseProduct, "de");
    expect(result.name).toBe("German Name");
    expect(result.description).toBe("German Desc");
  });

  it("falls back to base fields when locale not found", () => {
    const result = localizeProduct(baseProduct, "fr");
    expect(result.name).toBe("Base Name");
    expect(result.description).toBe("Base Description");
  });

  it("falls back to base name when translation name is empty (|| operator)", () => {
    const product = {
      ...baseProduct,
      translations: [{ locale: "de", name: "", description: "German Desc" }],
    };
    const result = localizeProduct(product, "de");
    expect(result.name).toBe("Base Name");
  });

  it("preserves empty string description (uses ?? operator)", () => {
    const product = {
      ...baseProduct,
      translations: [{ locale: "de", name: "German Name", description: "" }],
    };
    const result = localizeProduct(product, "de");
    expect(result.description).toBe("");
  });

  it("falls back description when translation description is null", () => {
    const product = {
      ...baseProduct,
      translations: [{ locale: "de", name: "German Name", description: null }],
    };
    const result = localizeProduct(product, "de");
    expect(result.description).toBe("Base Description");
  });

  it("handles empty translations array", () => {
    const product = { ...baseProduct, translations: [] };
    const result = localizeProduct(product, "de");
    expect(result.name).toBe("Base Name");
  });

  it("handles missing translations property", () => {
    const product = { id: "1", name: "Name", description: "Desc" };
    const result = localizeProduct(product, "de");
    expect(result.name).toBe("Name");
  });
});

describe("localizeProducts", () => {
  it("localizes an array of products", () => {
    const products = [
      {
        id: "1",
        name: "A",
        description: "A Desc",
        translations: [{ locale: "de", name: "A DE", description: "A DE Desc" }],
      },
      {
        id: "2",
        name: "B",
        description: "B Desc",
        translations: [{ locale: "de", name: "B DE", description: "B DE Desc" }],
      },
    ];
    const result = localizeProducts(products, "de");
    expect(result[0].name).toBe("A DE");
    expect(result[1].name).toBe("B DE");
  });

  it("returns empty array for empty input", () => {
    expect(localizeProducts([], "de")).toEqual([]);
  });
});
