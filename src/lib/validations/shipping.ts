import { z } from "zod";

// ---- Shipping Rate ----

export const shippingRateFormSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, "Name is required").max(100),
    type: z.enum(["FLAT", "WEIGHT_BASED", "PRICE_BASED"]),
    price: z.number().int().min(0, "Price must be 0 or more"),
    minValue: z.number().int().min(0).nullable().default(null),
    maxValue: z.number().int().min(0).nullable().default(null),
    freeAbove: z.number().int().min(0).nullable().default(null),
  })
  .refine(
    (data) => {
      if (data.type === "FLAT") return true;
      // For ranged types, min must be less than max (if both set)
      if (data.minValue !== null && data.maxValue !== null) {
        return data.minValue < data.maxValue;
      }
      return true;
    },
    { message: "Min value must be less than max value", path: ["maxValue"] },
  );

export type ShippingRateFormValues = z.infer<typeof shippingRateFormSchema>;

// ---- Shipping Zone ----

export const shippingZoneSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  countries: z.array(z.string().min(2).max(2)).min(1, "Select at least one country"),
  isDefault: z.boolean().default(false),
  rates: z.array(shippingRateFormSchema).min(1, "Add at least one shipping rate"),
});

export type ShippingZoneFormValues = z.infer<typeof shippingZoneSchema>;

// ---- Tax Zone ----

export const taxZoneSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  countries: z.array(z.string().min(2).max(2)).min(1, "Select at least one country"),
  taxRate: z
    .number()
    .min(0, "Tax rate must be 0 or more")
    .max(1, "Tax rate must be at most 100%"),
  taxInclusive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

export type TaxZoneFormValues = z.infer<typeof taxZoneSchema>;
