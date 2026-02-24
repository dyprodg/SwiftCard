"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { productReviews, orders, orderItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { updateTag } from "next/cache";
import {
  submitReviewSchema,
  moderateReviewSchema,
  deleteReviewSchema,
} from "@/lib/validations/review";

async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") throw new Error("Unauthorized");
  return userId;
}

export async function submitReview(input: {
  productId: string;
  rating: number;
  title: string;
  body?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return { success: false, error: "Sign in to leave a review" };

  const data = submitReviewSchema.parse(input);

  // Check if user already reviewed this product
  const existing = await db.query.productReviews.findFirst({
    where: and(
      eq(productReviews.userId, userId),
      eq(productReviews.productId, data.productId),
    ),
  });

  if (existing) {
    return { success: false, error: "You have already reviewed this product" };
  }

  // Check if user has purchased this product (verified purchase)
  const purchasedOrder = await db.query.orders.findFirst({
    where: and(eq(orders.userId, userId), eq(orders.paymentStatus, "PAID")),
    with: {
      items: {
        where: eq(orderItems.productId, data.productId),
      },
    },
  });

  const verified = (purchasedOrder?.items?.length ?? 0) > 0;

  const userEmail = (sessionClaims as { email?: string })?.email ?? "";
  const userName =
    (sessionClaims as { fullName?: string })?.fullName ??
    (sessionClaims as { firstName?: string })?.firstName ??
    "Customer";

  await db.insert(productReviews).values({
    productId: data.productId,
    userId,
    userEmail,
    userName,
    rating: data.rating,
    title: data.title,
    body: data.body,
    verified,
    status: "PENDING",
  });

  updateTag(`reviews:${data.productId}`);
  updateTag("reviews");
  return { success: true };
}

export async function moderateReview(input: {
  reviewId: string;
  status: "APPROVED" | "REJECTED";
}): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const data = moderateReviewSchema.parse(input);

  const review = await db.query.productReviews.findFirst({
    where: eq(productReviews.id, data.reviewId),
  });

  if (!review) return { success: false, error: "Review not found" };

  await db
    .update(productReviews)
    .set({ status: data.status })
    .where(eq(productReviews.id, data.reviewId));

  updateTag(`reviews:${review.productId}`);
  updateTag("reviews");
  return { success: true };
}

export async function deleteReview(input: {
  reviewId: string;
}): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const data = deleteReviewSchema.parse(input);

  const review = await db.query.productReviews.findFirst({
    where: eq(productReviews.id, data.reviewId),
  });

  if (!review) return { success: false, error: "Review not found" };

  await db.delete(productReviews).where(eq(productReviews.id, data.reviewId));

  updateTag(`reviews:${review.productId}`);
  updateTag("reviews");
  return { success: true };
}
