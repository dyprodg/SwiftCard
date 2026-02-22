import { z } from "zod";

export const generalSettingsSchema = z.object({
  shopName: z.string().min(1, "Shop name is required").max(200),
  shopDescription: z.string().max(500).optional().nullable(),
  contactEmail: z.string().email("Invalid email address"),
  allowGuestCheckout: z.boolean(),
});

export const shippingSettingsSchema = z.object({
  defaultShippingCost: z.number().int().min(0, "Must be 0 or more"),
  freeShippingThreshold: z.number().int().min(0).nullable(),
});

export const paymentSettingsSchema = z.object({
  currency: z.string().length(3, "Currency must be 3 characters"),
  defaultTaxRate: z.number().min(0, "Must be 0 or more").max(1, "Must be 1 or less"),
});

export const legalSettingsSchema = z.object({
  termsUrl: z.string().url("Invalid URL").or(z.literal("")).nullable(),
  privacyUrl: z.string().url("Invalid URL").or(z.literal("")).nullable(),
  imprintUrl: z.string().url("Invalid URL").or(z.literal("")).nullable(),
});

export type GeneralSettingsInput = z.infer<typeof generalSettingsSchema>;
export type ShippingSettingsInput = z.infer<typeof shippingSettingsSchema>;
export type PaymentSettingsInput = z.infer<typeof paymentSettingsSchema>;
export type LegalSettingsInput = z.infer<typeof legalSettingsSchema>;
