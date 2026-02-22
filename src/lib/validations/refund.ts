import { z } from "zod";

export const refundReasonValues = [
  "DAMAGED",
  "MISSING_ITEM",
  "CUSTOMER_REQUEST",
  "DUPLICATE",
  "OTHER",
] as const;

export type RefundReason = (typeof refundReasonValues)[number];

const refundItemSchema = z.object({
  orderItemId: z.string().min(1),
  quantity: z.number().int().min(1),
  amount: z.number().int().min(1),
});

const baseRefundFields = {
  orderId: z.string().min(1),
  reason: z.enum(refundReasonValues),
  note: z.string().optional(),
  restoreStock: z.boolean(),
};

export const fullRefundSchema = z.object({
  ...baseRefundFields,
  type: z.literal("full"),
});

export const partialRefundSchema = z.object({
  ...baseRefundFields,
  type: z.literal("partial"),
  items: z.array(refundItemSchema).min(1),
  totalAmount: z.number().int().min(1),
});

export const percentageRefundSchema = z.object({
  ...baseRefundFields,
  type: z.literal("percentage"),
  items: z.array(refundItemSchema).min(1),
  percentage: z.number().min(1).max(100),
  totalAmount: z.number().int().min(1),
});

export const refundSchema = z.discriminatedUnion("type", [
  fullRefundSchema,
  partialRefundSchema,
  percentageRefundSchema,
]);

export type RefundInput = z.infer<typeof refundSchema>;
export type FullRefundInput = z.infer<typeof fullRefundSchema>;
export type PartialRefundInput = z.infer<typeof partialRefundSchema>;
export type PercentageRefundInput = z.infer<typeof percentageRefundSchema>;
