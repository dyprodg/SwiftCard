import { z } from "zod";

// Admin: issue a new gift card
export const createGiftCardSchema = z.object({
  initialBalance: z.number().int().min(100, "Minimum CHF 1.00"),
  recipientEmail: z.string().email().optional(),
  recipientName: z.string().max(200).optional(),
  senderName: z.string().max(200).optional(),
  personalMessage: z.string().max(1000).optional(),
  expiresAt: z.string().optional(), // date or ISO datetime string
  note: z.string().max(500).optional(),
});

// Admin: update gift card status/expiry
export const updateGiftCardSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
  expiresAt: z.string().nullable().optional(),
});

// Admin: adjust gift card balance
export const adjustBalanceSchema = z.object({
  giftCardId: z.string().min(1),
  amount: z
    .number()
    .int()
    .refine((val) => val !== 0, "Amount cannot be zero"),
  note: z.string().min(1, "Note is required").max(500),
});

// Storefront: redeem gift card at checkout
export const redeemGiftCardSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(20)
    .transform((val) => val.replace(/[-\s]/g, "").toUpperCase()),
});

// Storefront: purchase a gift card
export const purchaseGiftCardSchema = z.object({
  amount: z.number().int().min(500, "Minimum CHF 5.00").max(50000, "Maximum CHF 500.00"),
  recipientEmail: z.string().email("Valid email required"),
  recipientName: z.string().min(1, "Recipient name is required").max(200),
  senderName: z.string().min(1, "Your name is required").max(200),
  personalMessage: z.string().max(1000).optional(),
});

// Form schema for admin create form (no defaults, for react-hook-form)
export const giftCardFormSchema = z.object({
  initialBalance: z.number().int().min(100, "Minimum CHF 1.00"),
  recipientEmail: z.string().email().or(z.literal("")).optional(),
  recipientName: z.string().max(200).optional(),
  senderName: z.string().max(200).optional(),
  personalMessage: z.string().max(1000).optional(),
  expiresAt: z.string().optional(),
  note: z.string().max(500).optional(),
  sendEmail: z.boolean(),
});

export type CreateGiftCardInput = z.infer<typeof createGiftCardSchema>;
export type UpdateGiftCardInput = z.infer<typeof updateGiftCardSchema>;
export type AdjustBalanceInput = z.infer<typeof adjustBalanceSchema>;
export type PurchaseGiftCardInput = z.infer<typeof purchaseGiftCardSchema>;
export type GiftCardFormValues = z.infer<typeof giftCardFormSchema>;
