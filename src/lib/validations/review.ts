import { z } from "zod";

export const submitReviewSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  body: z.string().max(2000, "Review too long").optional(),
});

export const moderateReviewSchema = z.object({
  reviewId: z.string().min(1, "Review ID is required"),
  status: z.enum(["APPROVED", "REJECTED"]),
});

export const deleteReviewSchema = z.object({
  reviewId: z.string().min(1, "Review ID is required"),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;
export type DeleteReviewInput = z.infer<typeof deleteReviewSchema>;
