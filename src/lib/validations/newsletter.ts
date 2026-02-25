import { z } from "zod";

export const subscribeNewsletterSchema = z.object({
  email: z.string().email("Valid email is required"),
  source: z.enum(["footer", "popup", "checkout"]).default("footer"),
});

export const createCampaignSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  subject: z.string().min(1, "Subject is required").max(200),
  previewText: z.string().max(200).optional(),
  bodyHtml: z.string().min(1, "Email body is required"),
  bodyJson: z.string().optional(),
  segment: z.enum([
    "all_subscribers",
    "customers_only",
    "high_value",
    "recent_purchasers",
  ]),
  scheduledAt: z.string().datetime().optional(),
});

export const updateCampaignSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  subject: z.string().min(1).max(200).optional(),
  previewText: z.string().max(200).nullable().optional(),
  bodyHtml: z.string().min(1).optional(),
  bodyJson: z.string().optional(),
  segment: z
    .enum(["all_subscribers", "customers_only", "high_value", "recent_purchasers"])
    .optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
});

export const importSubscribersSchema = z.object({
  emails: z.array(z.string().email()).min(1, "At least one email is required"),
});

// Form schema for admin campaign form (no defaults, for react-hook-form)
export const campaignFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  subject: z.string().min(1, "Subject is required").max(200),
  previewText: z.string().max(200).optional(),
  bodyHtml: z.string().min(1, "Email body is required"),
  segment: z.enum([
    "all_subscribers",
    "customers_only",
    "high_value",
    "recent_purchasers",
  ]),
  scheduledAt: z.string().optional(),
});

export type SubscribeNewsletterInput = z.infer<typeof subscribeNewsletterSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type ImportSubscribersInput = z.infer<typeof importSubscribersSchema>;
export type CampaignFormValues = z.infer<typeof campaignFormSchema>;
