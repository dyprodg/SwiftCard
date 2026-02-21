import { describe, it, expect } from "vitest";
import { SHIPPING_COUNTRIES } from "./countries";

describe("SHIPPING_COUNTRIES", () => {
  it("is a non-empty array", () => {
    expect(SHIPPING_COUNTRIES.length).toBeGreaterThan(0);
  });

  it("has Switzerland as first entry", () => {
    expect(SHIPPING_COUNTRIES[0].code).toBe("CH");
    expect(SHIPPING_COUNTRIES[0].name).toBe("Switzerland");
    expect(SHIPPING_COUNTRIES[0].nameDe).toBe("Schweiz");
  });

  it("every entry has code, name, and nameDe", () => {
    for (const country of SHIPPING_COUNTRIES) {
      expect(country.code).toMatch(/^[A-Z]{2}$/);
      expect(country.name.length).toBeGreaterThan(0);
      expect(country.nameDe.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate codes", () => {
    const codes = SHIPPING_COUNTRIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("includes common European countries", () => {
    const codes = SHIPPING_COUNTRIES.map((c) => c.code);
    expect(codes).toContain("CH");
    expect(codes).toContain("DE");
    expect(codes).toContain("AT");
    expect(codes).toContain("FR");
    expect(codes).toContain("IT");
  });
});
