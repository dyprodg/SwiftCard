import { z } from "zod";

export const shippingAddressSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  address1: z.string().min(3, "Address is required").max(200),
  address2: z.string().max(200).optional().default(""),
  city: z.string().min(1, "City is required").max(100),
  zip: z.string().min(3, "ZIP code is required").max(20),
  country: z.string().min(2, "Country is required").max(2),
});

export const checkoutSchema = z.object({
  shippingAddress: shippingAddressSchema,
  customerEmail: z.string().email("Invalid email address"),
  customerNote: z.string().max(500).optional().default(""),
});

export type ShippingAddress = z.infer<typeof shippingAddressSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;

// Form schema for React Hook Form (no defaults, all fields explicit)
export const checkoutFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  address1: z.string().min(3, "Address is required").max(200),
  address2: z.string().max(200).optional(),
  city: z.string().min(1, "City is required").max(100),
  zip: z.string().min(3, "ZIP code is required").max(20),
  country: z.string().min(2, "Country is required").max(2),
  customerNote: z.string().max(500).optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
