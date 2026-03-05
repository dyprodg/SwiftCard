import { z } from "zod";

const slugRegex = /^[a-z0-9-]+$/;

// Form schema — no defaults so input/output types match (for react-hook-form + zodResolver)
export const pageFormSchema = z.object({
  type: z.enum(["PAGE", "BLOG"]),
  title: z.string().min(1, "Title is required").max(200),
  slug: z
    .string()
    .max(200)
    .regex(slugRegex, "Slug may only contain lowercase letters, numbers, and hyphens")
    .optional()
    .or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  content: z.string(),
  excerpt: z.string().max(500).optional().or(z.literal("")),
  coverImageUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v) ?? null),
  metaTitle: z.string().max(200).optional().or(z.literal("")),
  metaDescription: z.string().max(300).optional().or(z.literal("")),
  tags: z.array(z.string().max(50)).max(20),
  translations: z
    .array(
      z.object({
        locale: z.string(),
        title: z.string().optional().or(z.literal("")),
        content: z.string().optional().or(z.literal("")),
        excerpt: z.string().max(500).optional().or(z.literal("")),
        metaTitle: z.string().max(200).optional().or(z.literal("")),
        metaDescription: z.string().max(300).optional().or(z.literal("")),
      }),
    )
    .optional(),
});

// Server schema — with defaults
export const createPageSchema = z.object({
  type: z.enum(["PAGE", "BLOG"]).default("PAGE"),
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: z
    .string()
    .trim()
    .max(200)
    .regex(slugRegex, "Slug may only contain lowercase letters, numbers, and hyphens")
    .optional()
    .or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  content: z.string().default(""),
  excerpt: z.string().max(500).optional().nullable(),
  coverImageUrl: z
    .string()
    .url()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v) ?? null),
  metaTitle: z.string().max(200).optional().nullable(),
  metaDescription: z.string().max(300).optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  translations: z
    .array(
      z.object({
        locale: z.string(),
        title: z.string().optional().nullable(),
        content: z.string().optional().nullable(),
        excerpt: z.string().max(500).optional().nullable(),
        metaTitle: z.string().max(200).optional().nullable(),
        metaDescription: z.string().max(300).optional().nullable(),
      }),
    )
    .optional(),
});

export const updatePageSchema = createPageSchema.partial().extend({
  id: z.string().min(1),
});

export type PageFormValues = z.infer<typeof pageFormSchema>;
export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
