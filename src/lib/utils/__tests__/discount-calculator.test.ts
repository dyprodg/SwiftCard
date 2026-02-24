import { describe, it, expect } from "vitest";
import { calculateDiscount, findBestAutomaticDiscount } from "../discount-calculator";

const baseDiscount = {
  id: "d1",
  code: "TEST20",
  name: "Test Discount",
  description: null,
  type: "PERCENTAGE" as const,
  value: 2000, // 20%
  minOrderAmount: null,
  maxUses: null,
  usedCount: 0,
  maxUsesPerCustomer: null,
  active: true,
  automatic: false,
  startsAt: null,
  expiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  productIds: [] as string[],
  categoryIds: [] as string[],
};

const cartItems = [
  { productId: "p1", categoryId: "c1", quantity: 2, unitPrice: 5000 },
  { productId: "p2", categoryId: "c2", quantity: 1, unitPrice: 3000 },
];

const subtotal = 13000; // 2*5000 + 1*3000

describe("calculateDiscount", () => {
  it("calculates percentage discount on full cart", () => {
    const result = calculateDiscount(baseDiscount, cartItems, subtotal);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(2600); // 20% of 13000
    expect(result!.freeShipping).toBe(false);
  });

  it("calculates fixed discount", () => {
    const discount = { ...baseDiscount, type: "FIXED" as const, value: 1500 };
    const result = calculateDiscount(discount, cartItems, subtotal);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(1500);
  });

  it("caps fixed discount at applicable subtotal", () => {
    const discount = { ...baseDiscount, type: "FIXED" as const, value: 99999 };
    const result = calculateDiscount(discount, cartItems, subtotal);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(13000); // capped at subtotal
  });

  it("returns free shipping for FREE_SHIPPING type", () => {
    const discount = {
      ...baseDiscount,
      type: "FREE_SHIPPING" as const,
      value: 0,
    };
    const result = calculateDiscount(discount, cartItems, subtotal);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(0);
    expect(result!.freeShipping).toBe(true);
  });

  it("returns null when minOrderAmount not met", () => {
    const discount = { ...baseDiscount, minOrderAmount: 20000 };
    const result = calculateDiscount(discount, cartItems, subtotal);
    expect(result).toBeNull();
  });

  it("applies when minOrderAmount is met", () => {
    const discount = { ...baseDiscount, minOrderAmount: 10000 };
    const result = calculateDiscount(discount, cartItems, subtotal);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(2600);
  });

  it("returns null when maxUses exceeded", () => {
    const discount = { ...baseDiscount, maxUses: 5, usedCount: 5 };
    const result = calculateDiscount(discount, cartItems, subtotal);
    expect(result).toBeNull();
  });

  it("returns null when discount is expired", () => {
    const discount = {
      ...baseDiscount,
      expiresAt: new Date("2020-01-01"),
    };
    const result = calculateDiscount(discount, cartItems, subtotal);
    expect(result).toBeNull();
  });

  it("returns null when discount hasn't started", () => {
    const discount = {
      ...baseDiscount,
      startsAt: new Date("2099-01-01"),
    };
    const result = calculateDiscount(discount, cartItems, subtotal);
    expect(result).toBeNull();
  });

  it("calculates product-scoped percentage discount", () => {
    const discount = { ...baseDiscount, productIds: ["p1"] };
    const result = calculateDiscount(discount, cartItems, subtotal);
    expect(result).not.toBeNull();
    // 20% of p1 total only: 2 * 5000 = 10000 -> 2000
    expect(result!.amount).toBe(2000);
  });

  it("calculates category-scoped percentage discount", () => {
    const discount = { ...baseDiscount, categoryIds: ["c2"] };
    const result = calculateDiscount(discount, cartItems, subtotal);
    expect(result).not.toBeNull();
    // 20% of c2 total only: 1 * 3000 = 3000 -> 600
    expect(result!.amount).toBe(600);
  });

  it("returns null when product-scoped discount has no matching items", () => {
    const discount = { ...baseDiscount, productIds: ["p999"] };
    const result = calculateDiscount(discount, cartItems, subtotal);
    expect(result).toBeNull();
  });

  it("caps fixed discount at scoped subtotal", () => {
    const discount = {
      ...baseDiscount,
      type: "FIXED" as const,
      value: 8000,
      productIds: ["p2"],
    };
    const result = calculateDiscount(discount, cartItems, subtotal);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(3000); // capped at p2 subtotal
  });

  it("rounds percentage discount correctly", () => {
    const discount = { ...baseDiscount, value: 3333 }; // 33.33%
    const items = [{ productId: "p1", categoryId: null, quantity: 1, unitPrice: 1000 }];
    const result = calculateDiscount(discount, items, 1000);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(333); // Math.round(1000 * 3333 / 10000)
  });
});

describe("findBestAutomaticDiscount", () => {
  it("selects the discount with highest amount", () => {
    const discounts = [
      { ...baseDiscount, id: "d1", value: 1000 }, // 10%
      { ...baseDiscount, id: "d2", value: 3000 }, // 30%
      { ...baseDiscount, id: "d3", value: 2000 }, // 20%
    ];

    const result = findBestAutomaticDiscount(discounts, cartItems, subtotal);
    expect(result).not.toBeNull();
    expect(result!.discountId).toBe("d2");
    expect(result!.amount).toBe(3900); // 30% of 13000
  });

  it("returns null when no discounts apply", () => {
    const discounts = [{ ...baseDiscount, id: "d1", minOrderAmount: 99999 }];
    const result = findBestAutomaticDiscount(discounts, cartItems, subtotal);
    expect(result).toBeNull();
  });

  it("prefers free shipping when amounts are equal", () => {
    const discounts = [
      { ...baseDiscount, id: "d1", type: "FREE_SHIPPING" as const, value: 0 },
      { ...baseDiscount, id: "d2", type: "FIXED" as const, value: 0 },
    ];

    const result = findBestAutomaticDiscount(discounts, cartItems, subtotal);
    expect(result).not.toBeNull();
    expect(result!.discountId).toBe("d1");
    expect(result!.freeShipping).toBe(true);
  });

  it("returns empty array handling", () => {
    const result = findBestAutomaticDiscount([], cartItems, subtotal);
    expect(result).toBeNull();
  });
});
