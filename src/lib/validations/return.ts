import { z } from "zod";

export const returnReasonValues = [
  "DEFECTIVE",
  "WRONG_ITEM",
  "NOT_AS_DESCRIBED",
  "CHANGED_MIND",
  "TOO_LARGE",
  "TOO_SMALL",
  "OTHER",
] as const;

export type ReturnReason = (typeof returnReasonValues)[number];

const returnItemSchema = z.object({
  orderItemId: z.string().min(1),
  quantity: z.number().int().min(1),
  reason: z.enum(returnReasonValues).optional(),
});

export const createReturnSchema = z.object({
  orderId: z.string().min(1),
  reason: z.enum(returnReasonValues),
  note: z.string().max(1000).optional(),
  items: z.array(returnItemSchema).min(1, "At least one item is required"),
});

export type CreateReturnInput = z.infer<typeof createReturnSchema>;

export const approveReturnSchema = z.object({
  returnId: z.string().min(1),
  adminNote: z.string().max(1000).optional(),
});

export type ApproveReturnInput = z.infer<typeof approveReturnSchema>;

export const rejectReturnSchema = z.object({
  returnId: z.string().min(1),
  adminNote: z.string().min(1, "Rejection reason is required").max(1000),
});

export type RejectReturnInput = z.infer<typeof rejectReturnSchema>;

export const receiveReturnSchema = z.object({
  returnId: z.string().min(1),
  adminNote: z.string().max(1000).optional(),
});

export type ReceiveReturnInput = z.infer<typeof receiveReturnSchema>;

export const refundReturnSchema = z.object({
  returnId: z.string().min(1),
  restoreStock: z.boolean(),
  adminNote: z.string().max(1000).optional(),
});

export type RefundReturnInput = z.infer<typeof refundReturnSchema>;
