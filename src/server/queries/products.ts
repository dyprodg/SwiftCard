import { db } from "@/db";
import { products, productImages, productVariants, categories } from "@/db/schema";
import { eq, desc, and, ilike, inArray, sql } from "drizzle-orm";

type ProductFilters = {
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  categoryId?: string;
  featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
};

export async function getProducts(filters: ProductFilters = {}) {
  const conditions = [];

  if (filters.status) {
    conditions.push(eq(products.status, filters.status));
  }
  if (filters.categoryId) {
    conditions.push(eq(products.categoryId, filters.categoryId));
  }
  if (filters.featured !== undefined) {
    conditions.push(eq(products.featured, filters.featured));
  }
  if (filters.search) {
    conditions.push(ilike(products.name, `%${filters.search}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db.query.products.findMany({
      where,
      with: {
        images: { orderBy: (img, { asc }) => [asc(img.position)] },
        variants: true,
        category: true,
        translations: true,
      },
      orderBy: [desc(products.createdAt)],
      limit: filters.limit ?? 20,
      offset: filters.offset ?? 0,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(where),
  ]);

  return {
    items,
    total: Number(countResult[0].count),
  };
}

export async function getProductBySlug(slug: string) {
  return db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: {
      images: { orderBy: (img, { asc }) => [asc(img.position)] },
      variants: true,
      category: true,
      translations: true,
    },
  });
}

export async function getProductById(id: string) {
  return db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      images: { orderBy: (img, { asc }) => [asc(img.position)] },
      variants: true,
      category: true,
      translations: true,
    },
  });
}

export async function getFeaturedProducts(limit: number = 6) {
  return db.query.products.findMany({
    where: and(eq(products.featured, true), eq(products.status, "ACTIVE")),
    with: {
      images: { orderBy: (img, { asc }) => [asc(img.position)], limit: 1 },
      variants: true,
      translations: true,
    },
    orderBy: [desc(products.createdAt)],
    limit,
  });
}

export async function getActiveProducts(limit: number = 20, offset: number = 0) {
  return getProducts({ status: "ACTIVE", limit, offset });
}
