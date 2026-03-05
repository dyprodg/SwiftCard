import { db } from "@/db";
import { pages, pageTranslations } from "@/db/schema";
import { eq, and, desc, sql, arrayContains } from "drizzle-orm";
import { cacheTag, cacheLife } from "next/cache";

type PageFilters = {
  type?: "PAGE" | "BLOG";
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  tag?: string;
  limit?: number;
  offset?: number;
};

export async function getPages(filters: PageFilters = {}) {
  "use cache";
  cacheTag("pages");
  cacheLife("minutes");

  const conditions = [];
  if (filters.type) conditions.push(eq(pages.type, filters.type));
  if (filters.status) conditions.push(eq(pages.status, filters.status));
  if (filters.tag) conditions.push(arrayContains(pages.tags, [filters.tag]));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db.query.pages.findMany({
      where,
      with: { translations: true },
      orderBy: [desc(pages.createdAt)],
      limit: filters.limit ?? 20,
      offset: filters.offset ?? 0,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(pages)
      .where(where),
  ]);

  return { items, total: Number(countResult[0].count) };
}

export async function getPageById(id: string) {
  "use cache";
  cacheTag("pages", id);
  cacheLife("minutes");

  return db.query.pages.findFirst({
    where: eq(pages.id, id),
    with: { translations: true },
  });
}

export async function getPageBySlug(slug: string) {
  "use cache";
  cacheTag("pages", slug);
  cacheLife("minutes");

  return db.query.pages.findFirst({
    where: eq(pages.slug, slug),
    with: { translations: true },
  });
}

export async function getPublishedBlogPosts(limit = 10, offset = 0) {
  "use cache";
  cacheTag("pages");
  cacheLife("minutes");

  const [items, countResult] = await Promise.all([
    db.query.pages.findMany({
      where: and(eq(pages.type, "BLOG"), eq(pages.status, "PUBLISHED")),
      with: { translations: true },
      orderBy: [desc(pages.publishedAt)],
      limit,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(pages)
      .where(and(eq(pages.type, "BLOG"), eq(pages.status, "PUBLISHED"))),
  ]);

  return { items, total: Number(countResult[0].count) };
}

export async function getPublishedBlogPostsByTag(tag: string, limit = 10, offset = 0) {
  "use cache";
  cacheTag("pages");
  cacheLife("minutes");

  const [items, countResult] = await Promise.all([
    db.query.pages.findMany({
      where: and(
        eq(pages.type, "BLOG"),
        eq(pages.status, "PUBLISHED"),
        arrayContains(pages.tags, [tag]),
      ),
      with: { translations: true },
      orderBy: [desc(pages.publishedAt)],
      limit,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(pages)
      .where(
        and(
          eq(pages.type, "BLOG"),
          eq(pages.status, "PUBLISHED"),
          arrayContains(pages.tags, [tag]),
        ),
      ),
  ]);

  return { items, total: Number(countResult[0].count) };
}

export async function getPublishedPageBySlug(slug: string) {
  "use cache";
  cacheTag("pages", slug);
  cacheLife("minutes");

  return db.query.pages.findFirst({
    where: and(eq(pages.slug, slug), eq(pages.status, "PUBLISHED")),
    with: { translations: true },
  });
}

export async function getPublishedPagesForSitemap() {
  "use cache";
  cacheTag("pages");
  cacheLife("hours");

  return db
    .select({
      slug: pages.slug,
      type: pages.type,
      updatedAt: pages.updatedAt,
      publishedAt: pages.publishedAt,
    })
    .from(pages)
    .where(eq(pages.status, "PUBLISHED"))
    .orderBy(desc(pages.publishedAt));
}

export async function getAllBlogTags() {
  "use cache";
  cacheTag("pages");
  cacheLife("hours");

  const result = await db
    .select({ tags: pages.tags })
    .from(pages)
    .where(and(eq(pages.type, "BLOG"), eq(pages.status, "PUBLISHED")));

  const tagSet = new Set<string>();
  for (const row of result) {
    for (const tag of row.tags ?? []) {
      tagSet.add(tag);
    }
  }

  return Array.from(tagSet).sort();
}
