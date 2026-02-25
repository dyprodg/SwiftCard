import { describe, it, expect } from "vitest";
import {
  createSubscriptionPlanSchema,
  updateSubscriptionPlanSchema,
  subscriptionPlanFormSchema,
} from "../subscription";

describe("createSubscriptionPlanSchema", () => {
  it("accepts valid input", () => {
    const result = createSubscriptionPlanSchema.safeParse({
      productId: "prod-1",
      name: "Monthly Coffee",
      interval: "MONTHLY",
      discountPercent: 500,
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid input with optional variantId", () => {
    const result = createSubscriptionPlanSchema.safeParse({
      productId: "prod-1",
      variantId: "var-1",
      name: "Weekly Tea",
      interval: "WEEKLY",
      discountPercent: 1000,
    });
    expect(result.success).toBe(true);
  });

  it("defaults discountPercent to 0 when omitted", () => {
    const result = createSubscriptionPlanSchema.safeParse({
      productId: "prod-1",
      name: "Yearly Bundle",
      interval: "YEARLY",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.discountPercent).toBe(0);
    }
  });

  it("rejects missing productId", () => {
    const result = createSubscriptionPlanSchema.safeParse({
      name: "Plan",
      interval: "MONTHLY",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty productId", () => {
    const result = createSubscriptionPlanSchema.safeParse({
      productId: "",
      name: "Plan",
      interval: "MONTHLY",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const result = createSubscriptionPlanSchema.safeParse({
      productId: "prod-1",
      interval: "MONTHLY",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = createSubscriptionPlanSchema.safeParse({
      productId: "prod-1",
      name: "",
      interval: "MONTHLY",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing interval", () => {
    const result = createSubscriptionPlanSchema.safeParse({
      productId: "prod-1",
      name: "Plan",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid interval value", () => {
    const result = createSubscriptionPlanSchema.safeParse({
      productId: "prod-1",
      name: "Plan",
      interval: "BIWEEKLY",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid interval enums", () => {
    for (const interval of ["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]) {
      const result = createSubscriptionPlanSchema.safeParse({
        productId: "prod-1",
        name: "Plan",
        interval,
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts discountPercent at lower bound (0)", () => {
    const result = createSubscriptionPlanSchema.safeParse({
      productId: "prod-1",
      name: "Plan",
      interval: "MONTHLY",
      discountPercent: 0,
    });
    expect(result.success).toBe(true);
  });

  it("accepts discountPercent at upper bound (10000)", () => {
    const result = createSubscriptionPlanSchema.safeParse({
      productId: "prod-1",
      name: "Plan",
      interval: "MONTHLY",
      discountPercent: 10000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects discountPercent below 0", () => {
    const result = createSubscriptionPlanSchema.safeParse({
      productId: "prod-1",
      name: "Plan",
      interval: "MONTHLY",
      discountPercent: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects discountPercent above 10000", () => {
    const result = createSubscriptionPlanSchema.safeParse({
      productId: "prod-1",
      name: "Plan",
      interval: "MONTHLY",
      discountPercent: 10001,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer discountPercent", () => {
    const result = createSubscriptionPlanSchema.safeParse({
      productId: "prod-1",
      name: "Plan",
      interval: "MONTHLY",
      discountPercent: 50.5,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateSubscriptionPlanSchema", () => {
  it("requires id", () => {
    const result = updateSubscriptionPlanSchema.safeParse({
      name: "Updated Plan",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty id", () => {
    const result = updateSubscriptionPlanSchema.safeParse({
      id: "",
      name: "Updated Plan",
    });
    expect(result.success).toBe(false);
  });

  it("accepts id with no optional fields", () => {
    const result = updateSubscriptionPlanSchema.safeParse({
      id: "plan-1",
    });
    expect(result.success).toBe(true);
  });

  it("accepts name update", () => {
    const result = updateSubscriptionPlanSchema.safeParse({
      id: "plan-1",
      name: "New Name",
    });
    expect(result.success).toBe(true);
  });

  it("accepts discountPercent update", () => {
    const result = updateSubscriptionPlanSchema.safeParse({
      id: "plan-1",
      discountPercent: 2000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts active toggle", () => {
    const result = updateSubscriptionPlanSchema.safeParse({
      id: "plan-1",
      active: false,
    });
    expect(result.success).toBe(true);
  });

  it("accepts all optional fields together", () => {
    const result = updateSubscriptionPlanSchema.safeParse({
      id: "plan-1",
      name: "Updated",
      discountPercent: 500,
      active: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts discountPercent at lower bound (0)", () => {
    const result = updateSubscriptionPlanSchema.safeParse({
      id: "plan-1",
      discountPercent: 0,
    });
    expect(result.success).toBe(true);
  });

  it("accepts discountPercent at upper bound (10000)", () => {
    const result = updateSubscriptionPlanSchema.safeParse({
      id: "plan-1",
      discountPercent: 10000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects discountPercent below 0", () => {
    const result = updateSubscriptionPlanSchema.safeParse({
      id: "plan-1",
      discountPercent: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects discountPercent above 10000", () => {
    const result = updateSubscriptionPlanSchema.safeParse({
      id: "plan-1",
      discountPercent: 10001,
    });
    expect(result.success).toBe(false);
  });
});

describe("subscriptionPlanFormSchema", () => {
  it("accepts valid input", () => {
    const result = subscriptionPlanFormSchema.safeParse({
      productId: "prod-1",
      name: "Quarterly Box",
      interval: "QUARTERLY",
      discountPercent: 1500,
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid input with optional variantId", () => {
    const result = subscriptionPlanFormSchema.safeParse({
      productId: "prod-1",
      variantId: "var-1",
      name: "Weekly Delivery",
      interval: "WEEKLY",
      discountPercent: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing productId", () => {
    const result = subscriptionPlanFormSchema.safeParse({
      name: "Plan",
      interval: "MONTHLY",
      discountPercent: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const result = subscriptionPlanFormSchema.safeParse({
      productId: "prod-1",
      interval: "MONTHLY",
      discountPercent: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing interval", () => {
    const result = subscriptionPlanFormSchema.safeParse({
      productId: "prod-1",
      name: "Plan",
      discountPercent: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing discountPercent (no default)", () => {
    const result = subscriptionPlanFormSchema.safeParse({
      productId: "prod-1",
      name: "Plan",
      interval: "MONTHLY",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid intervals", () => {
    for (const interval of ["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]) {
      const result = subscriptionPlanFormSchema.safeParse({
        productId: "prod-1",
        name: "Plan",
        interval,
        discountPercent: 0,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid interval", () => {
    const result = subscriptionPlanFormSchema.safeParse({
      productId: "prod-1",
      name: "Plan",
      interval: "DAILY",
      discountPercent: 0,
    });
    expect(result.success).toBe(false);
  });
});
