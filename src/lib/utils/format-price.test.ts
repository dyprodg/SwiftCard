import { describe, it, expect } from "vitest";
import { formatPrice } from "./format-price";

describe("formatPrice", () => {
  it("formats zero", () => {
    expect(formatPrice(0)).toContain("0.00");
  });

  it("formats whole amounts", () => {
    const result = formatPrice(1000);
    expect(result).toContain("10.00");
  });

  it("formats cents correctly", () => {
    const result = formatPrice(1999);
    expect(result).toContain("19.99");
  });

  it("formats large amounts", () => {
    const result = formatPrice(99999);
    expect(result).toContain("999.99");
  });

  it("uses CHF as default currency", () => {
    const result = formatPrice(100);
    expect(result).toContain("CHF");
  });

  it("accepts custom currency", () => {
    const result = formatPrice(100, "EUR");
    expect(result).toContain("EUR");
  });

  it("accepts custom locale", () => {
    const result = formatPrice(1000, "EUR", "de-DE");
    expect(result).toContain("10");
    // de-DE may render EUR as "€" symbol
    expect(result).toMatch(/EUR|€/);
  });

  it("handles single cent", () => {
    const result = formatPrice(1);
    expect(result).toContain("0.01");
  });
});
