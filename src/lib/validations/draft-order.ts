import { z } from "zod";

export const draftOrderItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable(),
  quantity: z.number().int().min(1),
  productName: z.string().min(1),
  variantName: z.string().nullable(),
  unitPrice: z.number().int().min(0),
  categoryId: z.string().nullable(),
});

export const createDraftOrderSchema = z.object({
  items: z.array(draftOrderItemSchema).min(1, "At least one item is required"),
  customerEmail: z.string().email("Invalid email address"),
  shippingName: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(30).optional().default(""),
  shippingAddress1: z.string().trim().min(3).max(200),
  shippingAddress2: z.string().max(200).optional().default(""),
  shippingCity: z.string().trim().min(1).max(100),
  shippingZip: z.string().trim().min(3).max(20),
  shippingCountry: z.string().min(2).max(2),
  couponCode: z.string().trim().max(50).optional(),
  shippingRateId: z.string().optional(),
  internalNote: z.string().max(2000).optional().default(""),
});

export type CreateDraftOrderInput = z.infer<typeof createDraftOrderSchema>;

export const updateDraftOrderSchema = z.object({
  orderId: z.string().min(1),
  items: z.array(draftOrderItemSchema).min(1, "At least one item is required"),
  customerEmail: z.string().email("Invalid email address"),
  shippingName: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(30).optional().default(""),
  shippingAddress1: z.string().trim().min(3).max(200),
  shippingAddress2: z.string().max(200).optional().default(""),
  shippingCity: z.string().trim().min(1).max(100),
  shippingZip: z.string().trim().min(3).max(20),
  shippingCountry: z.string().min(2).max(2),
  couponCode: z.string().trim().max(50).optional(),
  shippingRateId: z.string().optional(),
  internalNote: z.string().max(2000).optional().default(""),
});

export type UpdateDraftOrderInput = z.infer<typeof updateDraftOrderSchema>;

export const sendPaymentLinkSchema = z.object({
  orderId: z.string().min(1),
  customMessage: z.string().max(500).optional().default(""),
});

export type SendPaymentLinkInput = z.infer<typeof sendPaymentLinkSchema>;
