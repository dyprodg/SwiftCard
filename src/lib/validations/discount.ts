import { z } from "zod";

// Base shape without refinements (for react-hook-form compatibility)
const discountFormShape = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().max(500),
  type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
  value: z.number().int().min(0),
  active: z.boolean(),
  automatic: z.boolean(),
  code: z.string().trim().max(50),
  minOrderAmount: z.number().int().min(0).optional(),
  maxUses: z.number().int().min(1).optional(),
  maxUsesPerCustomer: z.number().int().min(1).optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  productIds: z.array(z.string()),
  categoryIds: z.array(z.string()),
});

export type DiscountFormValues = z.infer<typeof discountFormShape>;

// Admin form schema with refinements
export const discountFormSchema = discountFormShape
  .refine(
    (data) => {
      if (data.automatic && data.code && data.code.length > 0) return false;
      return true;
    },
    { message: "Automatic discounts cannot have a code", path: ["code"] },
  )
  .refine(
    (data) => {
      if (!data.automatic && (!data.code || data.code.length === 0)) return false;
      return true;
    },
    { message: "Manual discounts require a code", path: ["code"] },
  )
  .refine(
    (data) => {
      if (data.type === "PERCENTAGE" && (data.value < 1 || data.value > 10000))
        return false;
      return true;
    },
    { message: "Percentage must be between 0.01% and 100%", path: ["value"] },
  )
  .refine(
    (data) => {
      if (data.type === "FIXED" && data.value < 1) return false;
      return true;
    },
    { message: "Fixed amount must be at least 1 cent", path: ["value"] },
  );

// Server-side create schema
export const createDiscountSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
  value: z.number().int().min(0),
  active: z.boolean().default(true),
  automatic: z.boolean().default(false),
  code: z.string().trim().max(50).optional(),
  minOrderAmount: z.number().int().min(0).optional(),
  maxUses: z.number().int().min(1).optional(),
  maxUsesPerCustomer: z.number().int().min(1).optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  productIds: z.array(z.string()).default([]),
  categoryIds: z.array(z.string()).default([]),
});

export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;

// Server-side update schema
export const updateDiscountSchema = createDiscountSchema.extend({
  id: z.string().min(1),
});

export type UpdateDiscountInput = z.infer<typeof updateDiscountSchema>;

// Storefront coupon input schema
export const applyCouponSchema = z.object({
  code: z.string().trim().min(1, "Enter a coupon code").max(50),
});

export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
