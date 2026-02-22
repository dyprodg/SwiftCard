import { z } from "zod";

// Form schema — no defaults so input/output types match (for react-hook-form + zodResolver)
export const productFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  basePrice: z.number().int().min(0, "Price must be positive"),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  featured: z.boolean(),
  categoryId: z.string().optional(),
});

// Server schema — with defaults for server-side creation
export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  basePrice: z.number().int().min(0, "Price must be positive"),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  featured: z.boolean().default(false),
  categoryId: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().min(1),
});

export const createVariantSchema = z.object({
  productId: z.string().min(1),
  sku: z.string().min(1, "SKU is required").max(50),
  size: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
  material: z.string().max(100).optional(),
  priceAdjustment: z.number().int().default(0),
  stock: z.number().int().min(0).default(0),
  isAvailable: z.boolean().default(true),
});

export const updateVariantSchema = createVariantSchema.partial().extend({
  id: z.string().min(1),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  parentId: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type CreateProductInput = z.input<typeof createProductSchema>;
export type CreateProductOutput = z.output<typeof createProductSchema>;
export type UpdateProductInput = z.input<typeof updateProductSchema>;
export type CreateVariantInput = z.input<typeof createVariantSchema>;
export type UpdateVariantInput = z.input<typeof updateVariantSchema>;
export type CreateCategoryInput = z.input<typeof createCategorySchema>;
