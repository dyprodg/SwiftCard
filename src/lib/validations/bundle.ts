import { z } from "zod";

// Item schema with defaults — for server-side creation (missing quantity/position get defaults)
export const bundleItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable().optional(),
  quantity: z.number().int().positive().default(1),
  position: z.number().int().min(0).default(0),
});

// Item schema without defaults — for react-hook-form (input/output types match)
const bundleItemFormSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable().optional(),
  quantity: z.number().int().positive(),
  position: z.number().int().min(0),
});

// Form schema — no defaults so input/output types match (for react-hook-form + zodResolver)
export const bundleFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  bundlePrice: z.number().int().min(0, "Price must be non-negative"),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  featured: z.boolean(),
  items: z.array(bundleItemFormSchema).min(2, "Bundle must have at least 2 items"),
  translations: z
    .array(
      z.object({
        locale: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
      }),
    )
    .optional(),
});

// Server schema — with defaults for server-side creation
export const createBundleSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  slug: z.string().trim().max(200).optional(),
  description: z.string().max(2000).optional(),
  bundlePrice: z.number().int().min(0, "Price must be non-negative"),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  featured: z.boolean().default(false),
  items: z.array(bundleItemSchema).min(2, "Bundle must have at least 2 items"),
  translations: z
    .array(
      z.object({
        locale: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
      }),
    )
    .optional(),
});

export const updateBundleSchema = createBundleSchema.partial().extend({
  id: z.string().min(1),
});

export type BundleFormValues = z.infer<typeof bundleFormSchema>;
export type CreateBundleInput = z.infer<typeof createBundleSchema>;
export type UpdateBundleInput = z.infer<typeof updateBundleSchema>;
