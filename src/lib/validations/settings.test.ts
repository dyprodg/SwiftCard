import { describe, it, expect } from "vitest";
import {
  generalSettingsSchema,
  shippingSettingsSchema,
  paymentSettingsSchema,
  legalSettingsSchema,
} from "./settings";

describe("generalSettingsSchema", () => {
  const valid = {
    shopName: "SwiftCard",
    contactEmail: "info@swiftcard.ch",
    allowGuestCheckout: true,
  };

  it("accepts valid settings", () => {
    const result = generalSettingsSchema.parse(valid);
    expect(result.shopName).toBe("SwiftCard");
  });

  it("rejects empty shopName", () => {
    const result = generalSettingsSchema.safeParse({ ...valid, shopName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = generalSettingsSchema.safeParse({ ...valid, contactEmail: "bad" });
    expect(result.success).toBe(false);
  });

  it("accepts nullable shopDescription", () => {
    const result = generalSettingsSchema.parse({ ...valid, shopDescription: null });
    expect(result.shopDescription).toBeNull();
  });

  it("accepts string shopDescription", () => {
    const result = generalSettingsSchema.parse({
      ...valid,
      shopDescription: "A great shop",
    });
    expect(result.shopDescription).toBe("A great shop");
  });
});

describe("shippingSettingsSchema", () => {
  it("accepts valid settings", () => {
    const result = shippingSettingsSchema.parse({
      defaultShippingCost: 990,
      freeShippingThreshold: 10000,
    });
    expect(result.defaultShippingCost).toBe(990);
  });

  it("accepts nullable threshold", () => {
    const result = shippingSettingsSchema.parse({
      defaultShippingCost: 990,
      freeShippingThreshold: null,
    });
    expect(result.freeShippingThreshold).toBeNull();
  });

  it("rejects negative cost", () => {
    const result = shippingSettingsSchema.safeParse({
      defaultShippingCost: -1,
      freeShippingThreshold: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer cost", () => {
    const result = shippingSettingsSchema.safeParse({
      defaultShippingCost: 9.9,
      freeShippingThreshold: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("paymentSettingsSchema", () => {
  it("accepts valid settings", () => {
    const result = paymentSettingsSchema.parse({
      currency: "CHF",
      defaultTaxRate: 0.081,
    });
    expect(result.currency).toBe("CHF");
  });

  it("rejects currency with wrong length", () => {
    const resultShort = paymentSettingsSchema.safeParse({
      currency: "CH",
      defaultTaxRate: 0,
    });
    expect(resultShort.success).toBe(false);

    const resultLong = paymentSettingsSchema.safeParse({
      currency: "CHFF",
      defaultTaxRate: 0,
    });
    expect(resultLong.success).toBe(false);
  });

  it("rejects tax rate below 0", () => {
    const result = paymentSettingsSchema.safeParse({
      currency: "CHF",
      defaultTaxRate: -0.01,
    });
    expect(result.success).toBe(false);
  });

  it("rejects tax rate above 1", () => {
    const result = paymentSettingsSchema.safeParse({
      currency: "CHF",
      defaultTaxRate: 1.01,
    });
    expect(result.success).toBe(false);
  });

  it("accepts boundary tax rates (0 and 1)", () => {
    expect(
      paymentSettingsSchema.parse({ currency: "CHF", defaultTaxRate: 0 }).defaultTaxRate,
    ).toBe(0);
    expect(
      paymentSettingsSchema.parse({ currency: "CHF", defaultTaxRate: 1 }).defaultTaxRate,
    ).toBe(1);
  });
});

describe("legalSettingsSchema", () => {
  it("accepts valid URLs", () => {
    const result = legalSettingsSchema.parse({
      termsUrl: "https://example.com/terms",
      privacyUrl: "https://example.com/privacy",
      imprintUrl: "https://example.com/imprint",
    });
    expect(result.termsUrl).toBe("https://example.com/terms");
  });

  it("accepts null values", () => {
    const result = legalSettingsSchema.parse({
      termsUrl: null,
      privacyUrl: null,
      imprintUrl: null,
    });
    expect(result.termsUrl).toBeNull();
  });

  it("accepts empty strings", () => {
    const result = legalSettingsSchema.parse({
      termsUrl: "",
      privacyUrl: "",
      imprintUrl: "",
    });
    expect(result.termsUrl).toBe("");
  });

  it("rejects invalid URLs", () => {
    const result = legalSettingsSchema.safeParse({
      termsUrl: "not-a-url",
      privacyUrl: null,
      imprintUrl: null,
    });
    expect(result.success).toBe(false);
  });
});
