"use server";

import { getProducts } from "@/server/queries/products";

export async function searchProducts(query: string, limit: number = 5) {
  if (!query || query.trim().length < 2) return [];

  const result = await getProducts({
    status: "ACTIVE",
    search: query.trim(),
    limit,
  });

  return result.items;
}
