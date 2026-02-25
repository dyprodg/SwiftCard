import { db } from "@/db";
import { bundles } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { cacheTag, cacheLife } from "next/cache";

type BundleFilters = {
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  limit?: number;
  offset?: number;
};

export async function getBundles(filters: BundleFilters = {}) {
  "use cache";
  cacheTag("bundles");
  cacheLife("minutes");

  const conditions = [];
  if (filters.status) {
    conditions.push(eq(bundles.status, filters.status));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db.query.bundles.findMany({
      where,
      with: {
        items: {
          with: {
            product: {
              with: { images: true, variants: true },
            },
            variant: true,
          },
          orderBy: (item, { asc }) => [asc(item.position)],
        },
        translations: true,
      },
      orderBy: [desc(bundles.createdAt)],
      limit: filters.limit ?? 20,
      offset: filters.offset ?? 0,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(bundles)
      .where(where),
  ]);

  return { items, total: Number(countResult[0].count) };
}

export async function getBundleById(id: string) {
  "use cache";
  cacheTag("bundle", id);
  cacheLife("minutes");

  return db.query.bundles.findFirst({
    where: eq(bundles.id, id),
    with: {
      items: {
        with: {
          product: {
            with: { images: true, variants: true },
          },
          variant: true,
        },
        orderBy: (item, { asc }) => [asc(item.position)],
      },
      translations: true,
    },
  });
}

export async function getBundleBySlug(slug: string) {
  "use cache";
  cacheTag("bundle", slug);
  cacheLife("minutes");

  return db.query.bundles.findFirst({
    where: eq(bundles.slug, slug),
    with: {
      items: {
        with: {
          product: {
            with: { images: true, variants: true },
          },
          variant: true,
        },
        orderBy: (item, { asc }) => [asc(item.position)],
      },
      translations: true,
    },
  });
}

export async function getActiveBundles(limit: number = 20) {
  "use cache";
  cacheTag("bundles");
  cacheLife("hours");

  return db.query.bundles.findMany({
    where: eq(bundles.status, "ACTIVE"),
    with: {
      items: {
        with: {
          product: {
            with: { images: true, variants: true },
          },
          variant: true,
        },
        orderBy: (item, { asc }) => [asc(item.position)],
      },
      translations: true,
    },
    orderBy: [desc(bundles.createdAt)],
    limit,
  });
}
