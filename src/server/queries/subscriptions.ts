"use cache";

import { cacheTag, cacheLife } from "next/cache";
import { eq, and, desc, count, sql } from "drizzle-orm";

import { db } from "@/db";
import { subscriptionPlans, subscriptions } from "@/db/schema/subscriptions";
import { products, productImages, productVariants } from "@/db/schema/products";

export async function getSubscriptionPlans(opts?: {
  active?: boolean;
  productId?: string;
}) {
  cacheTag("subscription-plans");
  cacheLife("minutes");

  const conditions = [];
  if (opts?.active !== undefined) {
    conditions.push(eq(subscriptionPlans.active, opts.active));
  }
  if (opts?.productId) {
    conditions.push(eq(subscriptionPlans.productId, opts.productId));
  }

  return db.query.subscriptionPlans.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      product: { with: { images: true } },
      variant: true,
    },
    orderBy: [desc(subscriptionPlans.createdAt)],
  });
}

export async function getSubscriptionPlanById(id: string) {
  cacheTag("subscription-plans");
  cacheLife("minutes");

  return db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.id, id),
    with: {
      product: { with: { images: true } },
      variant: true,
    },
  });
}

export async function getSubscriptionPlansForProduct(productId: string) {
  cacheTag("subscription-plans");
  cacheLife("minutes");

  return db.query.subscriptionPlans.findMany({
    where: and(
      eq(subscriptionPlans.productId, productId),
      eq(subscriptionPlans.active, true),
    ),
    with: {
      variant: true,
    },
    orderBy: [desc(subscriptionPlans.createdAt)],
  });
}

export async function getSubscriptions(opts?: {
  status?: "ACTIVE" | "PAUSED" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
  limit?: number;
  offset?: number;
}) {
  cacheTag("subscriptions");
  cacheLife("minutes");

  const conditions = [];
  if (opts?.status) {
    conditions.push(eq(subscriptions.status, opts.status));
  }

  const items = await db.query.subscriptions.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      plan: {
        with: {
          product: { with: { images: true } },
          variant: true,
        },
      },
    },
    orderBy: [desc(subscriptions.createdAt)],
    limit: opts?.limit ?? 50,
    offset: opts?.offset ?? 0,
  });

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(subscriptions)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return { items, total };
}

export async function getSubscriptionsByCustomer(userId: string) {
  cacheTag("subscriptions");
  cacheLife("minutes");

  return db.query.subscriptions.findMany({
    where: eq(subscriptions.customerId, userId),
    with: {
      plan: {
        with: {
          product: { with: { images: true } },
          variant: true,
        },
      },
    },
    orderBy: [desc(subscriptions.createdAt)],
  });
}

export async function getSubscriptionById(id: string) {
  cacheTag("subscriptions");
  cacheLife("minutes");

  return db.query.subscriptions.findFirst({
    where: eq(subscriptions.id, id),
    with: {
      plan: {
        with: {
          product: { with: { images: true } },
          variant: true,
        },
      },
    },
  });
}

export async function getSubscriptionStats() {
  cacheTag("subscriptions");
  cacheLife("minutes");

  const [stats] = await db
    .select({
      total: count(),
      active:
        sql<number>`count(*) filter (where ${subscriptions.status} = 'ACTIVE')`.mapWith(
          Number,
        ),
      paused:
        sql<number>`count(*) filter (where ${subscriptions.status} = 'PAUSED')`.mapWith(
          Number,
        ),
      pastDue:
        sql<number>`count(*) filter (where ${subscriptions.status} = 'PAST_DUE')`.mapWith(
          Number,
        ),
      cancelled:
        sql<number>`count(*) filter (where ${subscriptions.status} = 'CANCELLED')`.mapWith(
          Number,
        ),
    })
    .from(subscriptions);

  // MRR: sum of active subscription plan prices (simplified — based on plan data)
  const [mrrResult] = await db
    .select({
      mrr: sql<number>`coalesce(sum(
        case
          when ${subscriptionPlans.interval} = 'WEEKLY' then (${products.basePrice} + coalesce(${productVariants.priceAdjustment}, 0)) * (10000 - ${subscriptionPlans.discountPercent}) / 10000 * 4.33
          when ${subscriptionPlans.interval} = 'MONTHLY' then (${products.basePrice} + coalesce(${productVariants.priceAdjustment}, 0)) * (10000 - ${subscriptionPlans.discountPercent}) / 10000
          when ${subscriptionPlans.interval} = 'QUARTERLY' then (${products.basePrice} + coalesce(${productVariants.priceAdjustment}, 0)) * (10000 - ${subscriptionPlans.discountPercent}) / 10000 / 3
          when ${subscriptionPlans.interval} = 'YEARLY' then (${products.basePrice} + coalesce(${productVariants.priceAdjustment}, 0)) * (10000 - ${subscriptionPlans.discountPercent}) / 10000 / 12
          else 0
        end
      ), 0)`.mapWith(Number),
    })
    .from(subscriptions)
    .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .innerJoin(products, eq(subscriptionPlans.productId, products.id))
    .leftJoin(productVariants, eq(subscriptionPlans.variantId, productVariants.id))
    .where(eq(subscriptions.status, "ACTIVE"));

  return {
    ...stats,
    mrr: Math.round(mrrResult.mrr),
  };
}
