import { describe, it, expect } from "vitest";
import { shippingZoneSchema, taxZoneSchema, shippingRateFormSchema } from "./shipping";
import {
  filterApplicableRates,
  calculateTaxAndTotal,
  type ShippingRateInput,
} from "../utils/shipping-calculator";

// ---- Shipping Rate Validation ----

describe("shippingRateFormSchema", () => {
  it("accepts a valid flat rate", () => {
    const result = shippingRateFormSchema.safeParse({
      name: "Standard",
      type: "FLAT",
      price: 990,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid weight-based rate", () => {
    const result = shippingRateFormSchema.safeParse({
      name: "Light",
      type: "WEIGHT_BASED",
      price: 590,
      minValue: 0,
      maxValue: 1000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid price-based rate", () => {
    const result = shippingRateFormSchema.safeParse({
      name: "Budget",
      type: "PRICE_BASED",
      price: 490,
      minValue: 0,
      maxValue: 5000,
      freeAbove: 10000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative price", () => {
    const result = shippingRateFormSchema.safeParse({
      name: "Bad",
      type: "FLAT",
      price: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = shippingRateFormSchema.safeParse({
      name: "",
      type: "FLAT",
      price: 500,
    });
    expect(result.success).toBe(false);
  });

  it("rejects min >= max for ranged types", () => {
    const result = shippingRateFormSchema.safeParse({
      name: "Bad Range",
      type: "WEIGHT_BASED",
      price: 500,
      minValue: 1000,
      maxValue: 500,
    });
    expect(result.success).toBe(false);
  });

  it("allows min >= max for FLAT (ignored)", () => {
    const result = shippingRateFormSchema.safeParse({
      name: "Flat",
      type: "FLAT",
      price: 500,
      minValue: 1000,
      maxValue: 500,
    });
    expect(result.success).toBe(true);
  });
});

// ---- Shipping Zone Validation ----

describe("shippingZoneSchema", () => {
  it("accepts a valid zone", () => {
    const result = shippingZoneSchema.safeParse({
      name: "Switzerland",
      countries: ["CH", "LI"],
      isDefault: false,
      rates: [{ name: "Standard", type: "FLAT", price: 990 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = shippingZoneSchema.safeParse({
      name: "",
      countries: ["CH"],
      rates: [{ name: "Standard", type: "FLAT", price: 990 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty countries", () => {
    const result = shippingZoneSchema.safeParse({
      name: "Empty",
      countries: [],
      rates: [{ name: "Standard", type: "FLAT", price: 990 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty rates", () => {
    const result = shippingZoneSchema.safeParse({
      name: "No Rates",
      countries: ["CH"],
      rates: [],
    });
    expect(result.success).toBe(false);
  });

  it("defaults isDefault to false", () => {
    const result = shippingZoneSchema.safeParse({
      name: "Test",
      countries: ["CH"],
      rates: [{ name: "Standard", type: "FLAT", price: 990 }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isDefault).toBe(false);
    }
  });
});

// ---- Tax Zone Validation ----

describe("taxZoneSchema", () => {
  it("accepts a valid tax zone", () => {
    const result = taxZoneSchema.safeParse({
      name: "Swiss VAT",
      countries: ["CH", "LI"],
      taxRate: 0.081,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative rate", () => {
    const result = taxZoneSchema.safeParse({
      name: "Bad",
      countries: ["CH"],
      taxRate: -0.1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects rate > 1", () => {
    const result = taxZoneSchema.safeParse({
      name: "Too High",
      countries: ["CH"],
      taxRate: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it("accepts 0% rate", () => {
    const result = taxZoneSchema.safeParse({
      name: "Tax Free",
      countries: ["CH"],
      taxRate: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty countries", () => {
    const result = taxZoneSchema.safeParse({
      name: "No Countries",
      countries: [],
      taxRate: 0.2,
    });
    expect(result.success).toBe(false);
  });

  it("defaults taxInclusive to true", () => {
    const result = taxZoneSchema.safeParse({
      name: "Swiss VAT",
      countries: ["CH"],
      taxRate: 0.081,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.taxInclusive).toBe(true);
    }
  });

  it("accepts taxInclusive = false", () => {
    const result = taxZoneSchema.safeParse({
      name: "US Tax",
      countries: ["US"],
      taxRate: 0.08,
      taxInclusive: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.taxInclusive).toBe(false);
    }
  });
});

// ---- Shipping Calculator ----

describe("filterApplicableRates", () => {
  const flatRate: ShippingRateInput = {
    id: "flat-1",
    name: "Standard",
    type: "FLAT",
    price: 990,
    minValue: null,
    maxValue: null,
    freeAbove: null,
  };

  const expressRate: ShippingRateInput = {
    id: "flat-2",
    name: "Express",
    type: "FLAT",
    price: 1990,
    minValue: null,
    maxValue: null,
    freeAbove: null,
  };

  const weightLight: ShippingRateInput = {
    id: "weight-1",
    name: "Light Package",
    type: "WEIGHT_BASED",
    price: 590,
    minValue: 0,
    maxValue: 1000,
    freeAbove: null,
  };

  const weightHeavy: ShippingRateInput = {
    id: "weight-2",
    name: "Heavy Package",
    type: "WEIGHT_BASED",
    price: 1490,
    minValue: 1001,
    maxValue: 5000,
    freeAbove: null,
  };

  const priceBased: ShippingRateInput = {
    id: "price-1",
    name: "Small Order",
    type: "PRICE_BASED",
    price: 990,
    minValue: 0,
    maxValue: 4999,
    freeAbove: null,
  };

  const freeAboveRate: ShippingRateInput = {
    id: "free-1",
    name: "Standard (free over 100)",
    type: "FLAT",
    price: 990,
    minValue: null,
    maxValue: null,
    freeAbove: 10000,
  };

  it("returns all flat rates regardless of weight/price", () => {
    const result = filterApplicableRates([flatRate, expressRate], 500, 3000);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Standard");
    expect(result[1].name).toBe("Express");
  });

  it("filters weight-based rates by cart weight", () => {
    const result = filterApplicableRates([weightLight, weightHeavy], 500, 3000);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Light Package");
    expect(result[0].price).toBe(590);
  });

  it("filters weight-based rates - heavy cart", () => {
    const result = filterApplicableRates([weightLight, weightHeavy], 2000, 3000);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Heavy Package");
  });

  it("returns no weight rates if weight is out of all ranges", () => {
    const result = filterApplicableRates([weightLight, weightHeavy], 6000, 3000);
    expect(result).toHaveLength(0);
  });

  it("filters price-based rates by subtotal", () => {
    const result = filterApplicableRates([priceBased], 0, 3000);
    expect(result).toHaveLength(1);
    expect(result[0].price).toBe(990);
  });

  it("excludes price-based rate when subtotal out of range", () => {
    const result = filterApplicableRates([priceBased], 0, 5000);
    expect(result).toHaveLength(0);
  });

  it("applies freeAbove threshold", () => {
    const result = filterApplicableRates([freeAboveRate], 0, 15000);
    expect(result).toHaveLength(1);
    expect(result[0].price).toBe(0);
    expect(result[0].originalPrice).toBe(990);
  });

  it("does not apply freeAbove when subtotal is below threshold", () => {
    const result = filterApplicableRates([freeAboveRate], 0, 5000);
    expect(result).toHaveLength(1);
    expect(result[0].price).toBe(990);
    expect(result[0].originalPrice).toBeUndefined();
  });

  it("mixes flat and weight-based rates", () => {
    const result = filterApplicableRates([flatRate, weightLight, weightHeavy], 500, 3000);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.name)).toEqual(["Standard", "Light Package"]);
  });

  it("handles maxValue null as unlimited", () => {
    const unlimitedWeight: ShippingRateInput = {
      id: "w-unlimited",
      name: "Any Weight",
      type: "WEIGHT_BASED",
      price: 1200,
      minValue: 0,
      maxValue: null,
      freeAbove: null,
    };
    const result = filterApplicableRates([unlimitedWeight], 99999, 0);
    expect(result).toHaveLength(1);
  });

  it("returns empty array for empty rates", () => {
    const result = filterApplicableRates([], 500, 3000);
    expect(result).toHaveLength(0);
  });
});

// ---- Tax Calculation ----

describe("calculateTaxAndTotal", () => {
  it("extracts tax from inclusive price (CH 8.1%)", () => {
    // Product costs CHF 89.90 (8990 cents), tax inclusive at 8.1%
    const { tax, total } = calculateTaxAndTotal(8990, 0, 0.081, true);
    // tax = round(8990 * 0.081 / 1.081) = round(673.63) = 674
    expect(tax).toBe(674);
    // total = 8990 + 0 shipping (tax already in subtotal)
    expect(total).toBe(8990);
  });

  it("adds tax on top for exclusive pricing", () => {
    // Product costs 8990 cents, tax exclusive at 8.1%
    const { tax, total } = calculateTaxAndTotal(8990, 0, 0.081, false);
    // tax = 8990 * 0.081 = 728.19 → 728
    expect(tax).toBe(728);
    // total = 8990 + 728 = 9718
    expect(total).toBe(9718);
  });

  it("inclusive: total = subtotal + shipping (tax not added)", () => {
    const { tax, total } = calculateTaxAndTotal(8990, 790, 0.081, true);
    expect(tax).toBe(674);
    expect(total).toBe(8990 + 790); // 9780
  });

  it("exclusive: total = subtotal + tax + shipping", () => {
    const { tax, total } = calculateTaxAndTotal(8990, 790, 0.081, false);
    expect(tax).toBe(728);
    expect(total).toBe(8990 + 728 + 790); // 10508
  });

  it("handles 0% tax rate", () => {
    const { tax, total } = calculateTaxAndTotal(10000, 500, 0, true);
    expect(tax).toBe(0);
    expect(total).toBe(10500);
  });

  it("handles German 19% inclusive", () => {
    // 100 EUR product (10000 cents), 19% inclusive
    const { tax, total } = calculateTaxAndTotal(10000, 0, 0.19, true);
    // tax = 10000 * 0.19 / 1.19 = 1596.64 → 1597
    expect(tax).toBe(1597);
    expect(total).toBe(10000);
  });

  it("handles German 19% exclusive", () => {
    const { tax, total } = calculateTaxAndTotal(10000, 0, 0.19, false);
    // tax = 10000 * 0.19 = 1900
    expect(tax).toBe(1900);
    expect(total).toBe(11900);
  });

  it("handles zero subtotal", () => {
    const { tax, total } = calculateTaxAndTotal(0, 790, 0.081, true);
    expect(tax).toBe(0);
    expect(total).toBe(790);
  });
});
