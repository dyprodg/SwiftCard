import { z } from "zod";

export const stockNotificationSchema = z.object({
  email: z.string().email("Valid email is required"),
  variantId: z.string().min(1, "Variant ID is required"),
  productId: z.string().min(1, "Product ID is required"),
});

export type StockNotificationInput = z.infer<typeof stockNotificationSchema>;
