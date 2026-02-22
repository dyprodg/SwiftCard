import { describe, it, expect } from "vitest";
import { organizationJsonLd, productJsonLd, breadcrumbJsonLd } from "./json-ld";

describe("organizationJsonLd", () => {
  it("returns valid Organization schema", () => {
    const result = organizationJsonLd("SwiftCard", "https://swiftcard.ch");
    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("Organization");
    expect(result.name).toBe("SwiftCard");
    expect(result.url).toBe("https://swiftcard.ch");
  });
});

describe("productJsonLd", () => {
  const baseProduct = {
    name: "T-Shirt",
    description: "A nice shirt",
    slug: "t-shirt",
    basePrice: 2990,
  };

  it("returns valid Product schema with variants", () => {
    const variants = [
      { priceAdjustment: 0, stock: 5 },
      { priceAdjustment: 500, stock: 3 },
    ];
    const images = [{ url: "https://img.test/1.jpg" }];
    const result = productJsonLd(
      baseProduct,
      variants,
      images,
      "https://swiftcard.ch",
      "de",
    );

    expect(result["@type"]).toBe("Product");
    expect(result.name).toBe("T-Shirt");
    expect(result.url).toBe("https://swiftcard.ch/de/products/t-shirt");
    expect(result.image).toEqual(["https://img.test/1.jpg"]);
    expect(result.offers.lowPrice).toBe("29.90");
    expect(result.offers.highPrice).toBe("34.90");
    expect(result.offers.offerCount).toBe(2);
    expect(result.offers.priceCurrency).toBe("CHF");
  });

  it("uses basePrice when no variants", () => {
    const result = productJsonLd(baseProduct, [], [], "https://swiftcard.ch", "en");
    expect(result.offers.lowPrice).toBe("29.90");
    expect(result.offers.highPrice).toBe("29.90");
    expect(result.offers.offerCount).toBe(1);
  });

  it("shows InStock when total stock > 0", () => {
    const variants = [{ priceAdjustment: 0, stock: 10 }];
    const result = productJsonLd(baseProduct, variants, [], "https://swiftcard.ch", "de");
    expect(result.offers.availability).toBe("https://schema.org/InStock");
  });

  it("shows OutOfStock when total stock is 0", () => {
    const variants = [
      { priceAdjustment: 0, stock: 0 },
      { priceAdjustment: 100, stock: 0 },
    ];
    const result = productJsonLd(baseProduct, variants, [], "https://swiftcard.ch", "de");
    expect(result.offers.availability).toBe("https://schema.org/OutOfStock");
  });

  it("defaults to InStock when no variants (stock unknown)", () => {
    const result = productJsonLd(baseProduct, [], [], "https://swiftcard.ch", "de");
    expect(result.offers.availability).toBe("https://schema.org/InStock");
  });

  it("handles null description", () => {
    const product = { ...baseProduct, description: null };
    const result = productJsonLd(product, [], [], "https://swiftcard.ch", "de");
    expect(result.description).toBeUndefined();
  });

  it("includes multiple images", () => {
    const images = [{ url: "https://img.test/1.jpg" }, { url: "https://img.test/2.jpg" }];
    const result = productJsonLd(baseProduct, [], images, "https://swiftcard.ch", "de");
    expect(result.image).toHaveLength(2);
  });
});

describe("breadcrumbJsonLd", () => {
  it("returns valid BreadcrumbList schema", () => {
    const items = [
      { name: "Home", url: "https://swiftcard.ch/de" },
      { name: "Products", url: "https://swiftcard.ch/de/products" },
    ];
    const result = breadcrumbJsonLd(items);
    expect(result["@type"]).toBe("BreadcrumbList");
    expect(result.itemListElement).toHaveLength(2);
    expect(result.itemListElement[0].position).toBe(1);
    expect(result.itemListElement[1].position).toBe(2);
    expect(result.itemListElement[0].name).toBe("Home");
  });

  it("handles empty items", () => {
    const result = breadcrumbJsonLd([]);
    expect(result.itemListElement).toEqual([]);
  });

  it("sets correct @type on each item", () => {
    const items = [{ name: "Home", url: "/" }];
    expect(result(items).itemListElement[0]["@type"]).toBe("ListItem");

    function result(i: { name: string; url: string }[]) {
      return breadcrumbJsonLd(i);
    }
  });
});
