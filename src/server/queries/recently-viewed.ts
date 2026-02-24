import { db } from "@/db";
import { products } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { cacheTag, cacheLife } from "next/cache";

export async function getProductsByIds(ids: string[]) {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  if (ids.length === 0) return [];

  const items = await db.query.products.findMany({
    where: inArray(products.id, ids),
    with: {
      images: { orderBy: (img, { asc }) => [asc(img.position)], limit: 1 },
      variants: true,
      translations: true,
    },
  });

  // Preserve the order of IDs
  const map = new Map(items.map((item) => [item.id, item]));
  return ids.map((id) => map.get(id)).filter(Boolean) as typeof items;
}
