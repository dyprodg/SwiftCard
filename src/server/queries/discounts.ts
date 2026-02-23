import { db } from "@/db";
import { discounts, discountProducts, discountCategories } from "@/db/schema";
import { eq, and, desc, sql, lte, gte, or, isNull } from "drizzle-orm";
import { cacheTag, cacheLife } from "next/cache";

type DiscountFilters = {
  status?: "active" | "inactive" | "expired";
  search?: string;
  limit?: number;
  offset?: number;
};

export async function getDiscounts(filters: DiscountFilters = {}) {
  "use cache";
  cacheTag("discounts");
  cacheLife("minutes");

  const conditions = [];
  const now = new Date();

  if (filters.status === "active") {
    conditions.push(eq(discounts.active, true));
    conditions.push(or(isNull(discounts.expiresAt), gte(discounts.expiresAt, now)));
  } else if (filters.status === "inactive") {
    conditions.push(eq(discounts.active, false));
  } else if (filters.status === "expired") {
    conditions.push(lte(discounts.expiresAt, now));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db.query.discounts.findMany({
      where,
      with: {
        products: true,
        categories: true,
      },
      orderBy: [desc(discounts.createdAt)],
      limit: filters.limit ?? 20,
      offset: filters.offset ?? 0,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(discounts)
      .where(where),
  ]);

  return {
    items,
    total: Number(countResult[0].count),
  };
}

export async function getDiscountById(id: string) {
  "use cache";
  cacheTag("discounts", id);
  cacheLife("minutes");

  return db.query.discounts.findFirst({
    where: eq(discounts.id, id),
    with: {
      products: true,
      categories: true,
    },
  });
}

export async function getActiveAutomaticDiscounts() {
  "use cache";
  cacheTag("discounts");
  cacheLife("minutes");

  const now = new Date();

  return db.query.discounts.findMany({
    where: and(
      eq(discounts.active, true),
      eq(discounts.automatic, true),
      or(isNull(discounts.startsAt), lte(discounts.startsAt, now)),
      or(isNull(discounts.expiresAt), gte(discounts.expiresAt, now)),
    ),
    with: {
      products: true,
      categories: true,
    },
  });
}

/**
 * All active, non-expired discounts for storefront display (badges, prices).
 * Returns discounts with their product/category scopes.
 */
export async function getActiveDiscountsForDisplay() {
  "use cache";
  cacheTag("discounts");
  cacheLife("minutes");

  const now = new Date();

  return db.query.discounts.findMany({
    where: and(
      eq(discounts.active, true),
      or(isNull(discounts.startsAt), lte(discounts.startsAt, now)),
      or(isNull(discounts.expiresAt), gte(discounts.expiresAt, now)),
    ),
    with: {
      products: true,
      categories: true,
    },
  });
}

/**
 * Validate a coupon code — NOT cached (real-time check).
 */
export async function getDiscountByCode(code: string) {
  const now = new Date();

  const discount = await db.query.discounts.findFirst({
    where: and(
      eq(discounts.code, code.toUpperCase()),
      eq(discounts.active, true),
      eq(discounts.automatic, false),
      or(isNull(discounts.startsAt), lte(discounts.startsAt, now)),
      or(isNull(discounts.expiresAt), gte(discounts.expiresAt, now)),
    ),
    with: {
      products: true,
      categories: true,
    },
  });

  if (!discount) return null;

  // Check global usage limit
  if (discount.maxUses && discount.usedCount >= discount.maxUses) return null;

  return discount;
}
