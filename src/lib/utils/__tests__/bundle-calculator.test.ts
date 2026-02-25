import { describe, it, expect } from "vitest";
import {
  calculateBundleItemsTotal,
  calculateBundleSavings,
  allocateBundlePrice,
} from "../bundle-calculator";

// ==================== calculateBundleItemsTotal ====================

describe("calculateBundleItemsTotal", () => {
  it("sums up item prices * quantities", () => {
    const items = [
      { unitPrice: 1000, quantity: 2 },
      { unitPrice: 500, quantity: 1 },
    ];
    expect(calculateBundleItemsTotal(items)).toBe(2500);
  });

  it("returns 0 for empty items", () => {
    expect(calculateBundleItemsTotal([])).toBe(0);
  });

  it("handles single item", () => {
    expect(calculateBundleItemsTotal([{ unitPrice: 3000, quantity: 1 }])).toBe(3000);
  });
});

// ==================== calculateBundleSavings ====================

describe("calculateBundleSavings", () => {
  const items = [
    { unitPrice: 2000, quantity: 1 },
    { unitPrice: 1500, quantity: 1 },
  ];
  // totalValue = 3500

  it("calculates savings when bundle price is less than item total", () => {
    const result = calculateBundleSavings(2990, items);
    expect(result.totalValue).toBe(3500);
    expect(result.savings).toBe(510); // 3500 - 2990
    expect(result.savingsPercent).toBe(15); // Math.round(510/3500*100) = 14.57 ≈ 15
  });

  it("returns zero savings when bundle price equals item total", () => {
    const result = calculateBundleSavings(3500, items);
    expect(result.savings).toBe(0);
    expect(result.savingsPercent).toBe(0);
  });

  it("returns zero savings when bundle price exceeds item total", () => {
    const result = calculateBundleSavings(5000, items);
    expect(result.savings).toBe(0);
    expect(result.savingsPercent).toBe(0);
  });

  it("handles empty items", () => {
    const result = calculateBundleSavings(1000, []);
    expect(result.totalValue).toBe(0);
    expect(result.savings).toBe(0);
    expect(result.savingsPercent).toBe(0);
  });

  it("handles items with quantity > 1", () => {
    const multiItems = [
      { unitPrice: 1000, quantity: 3 },
      { unitPrice: 2000, quantity: 2 },
    ];
    // totalValue = 3000 + 4000 = 7000
    const result = calculateBundleSavings(5000, multiItems);
    expect(result.totalValue).toBe(7000);
    expect(result.savings).toBe(2000);
    expect(result.savingsPercent).toBe(29); // Math.round(2000/7000*100) = 28.57 ≈ 29
  });
});

// ==================== allocateBundlePrice ====================

describe("allocateBundlePrice", () => {
  it("allocates proportionally based on item values", () => {
    const items = [
      { id: "a", unitPrice: 2000, quantity: 1 },
      { id: "b", unitPrice: 1000, quantity: 1 },
    ];
    // total = 3000, bundlePrice = 2400
    // a proportion = 2000/3000 = 0.667 → 1600
    // b proportion = 1000/3000 = 0.333 → remainder = 2400-1600 = 800
    const result = allocateBundlePrice(2400, items);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("a");
    expect(result[1].id).toBe("b");
    // Sum must equal bundlePrice
    expect(result[0].allocatedPrice + result[1].allocatedPrice).toBe(2400);
  });

  it("handles equal items", () => {
    const items = [
      { id: "a", unitPrice: 1000, quantity: 1 },
      { id: "b", unitPrice: 1000, quantity: 1 },
    ];
    const result = allocateBundlePrice(1500, items);
    expect(result[0].allocatedPrice + result[1].allocatedPrice).toBe(1500);
  });

  it("handles single item", () => {
    const items = [{ id: "a", unitPrice: 2000, quantity: 1 }];
    const result = allocateBundlePrice(1500, items);
    expect(result[0].allocatedPrice).toBe(1500);
  });

  it("handles zero total value", () => {
    const items = [
      { id: "a", unitPrice: 0, quantity: 1 },
      { id: "b", unitPrice: 0, quantity: 1 },
    ];
    const result = allocateBundlePrice(0, items);
    expect(result[0].allocatedPrice).toBe(0);
    expect(result[1].allocatedPrice).toBe(0);
  });

  it("ensures sum always equals bundle price (no rounding drift)", () => {
    const items = [
      { id: "a", unitPrice: 3333, quantity: 1 },
      { id: "b", unitPrice: 3333, quantity: 1 },
      { id: "c", unitPrice: 3334, quantity: 1 },
    ];
    const bundlePrice = 7500;
    const result = allocateBundlePrice(bundlePrice, items);
    const total = result.reduce((sum, r) => sum + r.allocatedPrice, 0);
    expect(total).toBe(bundlePrice);
  });

  it("handles items with different quantities", () => {
    const items = [
      { id: "a", unitPrice: 1000, quantity: 2 }, // value = 2000
      { id: "b", unitPrice: 3000, quantity: 1 }, // value = 3000
    ];
    // total = 5000, bundlePrice = 4000
    const result = allocateBundlePrice(4000, items);
    const total = result.reduce((sum, r) => sum + r.allocatedPrice, 0);
    expect(total).toBe(4000);
    // a should get ~40%, b should get ~60%
    expect(result[0].allocatedPrice).toBe(1600);
    expect(result[1].allocatedPrice).toBe(2400);
  });
});
