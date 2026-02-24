"use server";

import { getProducts } from "@/server/queries/products";
import { getProductsByIds } from "@/server/queries/recently-viewed";

export async function searchProducts(query: string, limit: number = 5) {
  if (!query || query.trim().length < 2) return [];

  const result = await getProducts({
    status: "ACTIVE",
    search: query.trim(),
    limit,
  });

  return result.items;
}

export async function fetchRecentlyViewedProducts(ids: string[]) {
  if (ids.length === 0) return [];
  return getProductsByIds(ids.slice(0, 6));
}
