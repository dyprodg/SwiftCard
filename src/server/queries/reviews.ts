import { db } from "@/db";
import { productReviews } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { cacheTag, cacheLife } from "next/cache";
import type { ReviewRatingStats } from "@/types";

export async function getProductReviews(productId: string) {
  "use cache";
  cacheTag("reviews", productId);
  cacheLife("minutes");

  return db.query.productReviews.findMany({
    where: and(
      eq(productReviews.productId, productId),
      eq(productReviews.status, "APPROVED"),
    ),
    orderBy: [desc(productReviews.createdAt)],
  });
}

export async function getProductRatingStats(
  productId: string,
): Promise<ReviewRatingStats> {
  "use cache";
  cacheTag("reviews", productId);
  cacheLife("minutes");

  const rows = await db
    .select({
      rating: productReviews.rating,
      count: sql<number>`count(*)`,
    })
    .from(productReviews)
    .where(
      and(eq(productReviews.productId, productId), eq(productReviews.status, "APPROVED")),
    )
    .groupBy(productReviews.rating);

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalReviews = 0;
  let ratingSum = 0;

  for (const row of rows) {
    const count = Number(row.count);
    distribution[row.rating] = count;
    totalReviews += count;
    ratingSum += row.rating * count;
  }

  return {
    averageRating: totalReviews > 0 ? ratingSum / totalReviews : 0,
    totalReviews,
    distribution,
  };
}

export async function getProductsRatingStats(
  productIds: string[],
): Promise<Record<string, ReviewRatingStats>> {
  "use cache";
  cacheTag("reviews");
  cacheLife("minutes");

  if (productIds.length === 0) return {};

  const rows = await db
    .select({
      productId: productReviews.productId,
      rating: productReviews.rating,
      count: sql<number>`count(*)`,
    })
    .from(productReviews)
    .where(eq(productReviews.status, "APPROVED"))
    .groupBy(productReviews.productId, productReviews.rating);

  const map: Record<string, ReviewRatingStats> = {};

  for (const row of rows) {
    if (!productIds.includes(row.productId)) continue;

    if (!map[row.productId]) {
      map[row.productId] = {
        averageRating: 0,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const count = Number(row.count);
    map[row.productId].distribution[row.rating] = count;
    map[row.productId].totalReviews += count;
  }

  // Calculate averages
  for (const stats of Object.values(map)) {
    let sum = 0;
    for (const [rating, count] of Object.entries(stats.distribution)) {
      sum += Number(rating) * count;
    }
    stats.averageRating = stats.totalReviews > 0 ? sum / stats.totalReviews : 0;
  }

  return map;
}

export async function getUserReview(userId: string, productId: string) {
  "use cache";
  cacheTag("reviews", productId, userId);
  cacheLife("minutes");

  return db.query.productReviews.findFirst({
    where: and(
      eq(productReviews.userId, userId),
      eq(productReviews.productId, productId),
    ),
  });
}

type AdminReviewFilters = {
  status?: "PENDING" | "APPROVED" | "REJECTED";
  limit?: number;
  offset?: number;
};

export async function getAdminReviews(filters: AdminReviewFilters = {}) {
  "use cache";
  cacheTag("reviews");
  cacheLife("minutes");

  const conditions = [];

  if (filters.status) {
    conditions.push(eq(productReviews.status, filters.status));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db.query.productReviews.findMany({
      where,
      with: {
        product: {
          columns: { id: true, name: true, slug: true },
        },
      },
      orderBy: [desc(productReviews.createdAt)],
      limit: filters.limit ?? 20,
      offset: filters.offset ?? 0,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(productReviews)
      .where(where),
  ]);

  return {
    items,
    total: Number(countResult[0].count),
  };
}
