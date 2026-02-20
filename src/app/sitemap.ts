import type { MetadataRoute } from "next";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000";
const locales = ["de", "en"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all active products
  const activeProducts = await db
    .select({ slug: products.slug, updatedAt: products.updatedAt })
    .from(products)
    .where(eq(products.status, "ACTIVE"));

  const entries: MetadataRoute.Sitemap = [];

  // Static pages × locales
  const staticPages = [
    { path: "", changeFrequency: "daily" as const, priority: 1.0 },
    { path: "/products", changeFrequency: "daily" as const, priority: 0.9 },
  ];

  for (const page of staticPages) {
    for (const locale of locales) {
      entries.push({
        url: `${APP_URL}/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${APP_URL}/${l}${page.path}`]),
          ),
        },
      });
    }
  }

  // Product pages × locales
  for (const product of activeProducts) {
    for (const locale of locales) {
      entries.push({
        url: `${APP_URL}/${locale}/products/${product.slug}`,
        lastModified: product.updatedAt ?? new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${APP_URL}/${l}/products/${product.slug}`]),
          ),
        },
      });
    }
  }

  return entries;
}
