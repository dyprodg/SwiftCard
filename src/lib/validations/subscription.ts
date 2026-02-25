import { z } from "zod";

export const createSubscriptionPlanSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  name: z.string().min(1).max(200),
  interval: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  discountPercent: z.number().int().min(0).max(10000).default(0),
});

export const updateSubscriptionPlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  discountPercent: z.number().int().min(0).max(10000).optional(),
  active: z.boolean().optional(),
});

export const subscriptionPlanFormSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  name: z.string().min(1).max(200),
  interval: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  discountPercent: z.number().int().min(0).max(10000),
});

export type CreateSubscriptionPlanInput = z.infer<typeof createSubscriptionPlanSchema>;
export type UpdateSubscriptionPlanInput = z.infer<typeof updateSubscriptionPlanSchema>;
export type SubscriptionPlanFormValues = z.infer<typeof subscriptionPlanFormSchema>;
