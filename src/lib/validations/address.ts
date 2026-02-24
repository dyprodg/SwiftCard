import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(50),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().trim().max(30).optional().default(""),
  company: z.string().trim().max(100).optional().default(""),
  address1: z.string().trim().min(3, "Address is required").max(200),
  address2: z.string().max(200).optional().default(""),
  city: z.string().trim().min(1, "City is required").max(100),
  zip: z.string().trim().min(3, "ZIP code is required").max(20),
  country: z.string().min(2, "Country is required").max(2),
  isDefault: z.boolean().optional().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;

export const addressFormSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(50),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().trim().max(30).optional(),
  company: z.string().trim().max(100).optional(),
  address1: z.string().trim().min(3, "Address is required").max(200),
  address2: z.string().max(200).optional(),
  city: z.string().trim().min(1, "City is required").max(100),
  zip: z.string().trim().min(3, "ZIP code is required").max(20),
  country: z.string().min(2, "Country is required").max(2),
  isDefault: z.boolean().optional(),
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;
