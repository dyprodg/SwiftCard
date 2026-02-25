import { describe, it, expect } from "vitest";
import {
  calculateSubscriptionPrice,
  toStripeInterval,
  intervalKey,
} from "../subscription-price";

describe("calculateSubscriptionPrice", () => {
  it("returns full price when discount is 0", () => {
    expect(calculateSubscriptionPrice(1000, 0, 0)).toBe(1000);
  });

  it("returns full price with variant adjustment and no discount", () => {
    expect(calculateSubscriptionPrice(1000, 500, 0)).toBe(1500);
  });

  it("returns full price when discount is negative", () => {
    expect(calculateSubscriptionPrice(1000, 0, -100)).toBe(1000);
  });

  it("applies 10% discount (1000 basis points)", () => {
    // 1000 cents * (1 - 1000/10000) = 1000 * 0.9 = 900
    expect(calculateSubscriptionPrice(1000, 0, 1000)).toBe(900);
  });

  it("applies 10% discount with variant adjustment", () => {
    // (1000 + 500) * 0.9 = 1350
    expect(calculateSubscriptionPrice(1000, 500, 1000)).toBe(1350);
  });

  it("applies 50% discount (5000 basis points)", () => {
    // 2000 * (1 - 0.5) = 1000
    expect(calculateSubscriptionPrice(2000, 0, 5000)).toBe(1000);
  });

  it("returns 0 when discount is 100% (10000 basis points)", () => {
    expect(calculateSubscriptionPrice(1000, 500, 10000)).toBe(0);
  });

  it("returns 0 when discount exceeds 100%", () => {
    expect(calculateSubscriptionPrice(1000, 0, 15000)).toBe(0);
  });

  it("rounds correctly for non-even discounts", () => {
    // 999 cents * (1 - 3333/10000) = 999 * 0.6667 = 666.0333 → 666
    expect(calculateSubscriptionPrice(999, 0, 3333)).toBe(666);
  });

  it("rounds to nearest integer", () => {
    // 1001 cents * (1 - 1000/10000) = 1001 * 0.9 = 900.9 → 901
    expect(calculateSubscriptionPrice(1001, 0, 1000)).toBe(901);
  });

  it("handles zero base price", () => {
    expect(calculateSubscriptionPrice(0, 0, 5000)).toBe(0);
  });
});

describe("toStripeInterval", () => {
  it("maps WEEKLY to week with count 1", () => {
    expect(toStripeInterval("WEEKLY")).toEqual({
      interval: "week",
      interval_count: 1,
    });
  });

  it("maps MONTHLY to month with count 1", () => {
    expect(toStripeInterval("MONTHLY")).toEqual({
      interval: "month",
      interval_count: 1,
    });
  });

  it("maps QUARTERLY to month with count 3", () => {
    expect(toStripeInterval("QUARTERLY")).toEqual({
      interval: "month",
      interval_count: 3,
    });
  });

  it("maps YEARLY to year with count 1", () => {
    expect(toStripeInterval("YEARLY")).toEqual({
      interval: "year",
      interval_count: 1,
    });
  });
});

describe("intervalKey", () => {
  it("returns perWeek for WEEKLY", () => {
    expect(intervalKey("WEEKLY")).toBe("perWeek");
  });

  it("returns perMonth for MONTHLY", () => {
    expect(intervalKey("MONTHLY")).toBe("perMonth");
  });

  it("returns perQuarter for QUARTERLY", () => {
    expect(intervalKey("QUARTERLY")).toBe("perQuarter");
  });

  it("returns perYear for YEARLY", () => {
    expect(intervalKey("YEARLY")).toBe("perYear");
  });
});
