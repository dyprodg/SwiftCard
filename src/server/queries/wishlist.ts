import { db } from "@/db";
import { wishlists } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cacheTag, cacheLife } from "next/cache";

export async function getWishlist(userId: string) {
  "use cache";
  cacheTag("wishlist", userId);
  cacheLife("minutes");

  return db.query.wishlists.findMany({
    where: eq(wishlists.userId, userId),
    with: {
      product: {
        with: {
          images: { orderBy: (img, { asc }) => [asc(img.position)], limit: 1 },
          variants: true,
          translations: true,
        },
      },
    },
    orderBy: (w, { desc }) => [desc(w.createdAt)],
  });
}

export async function getWishlistProductIds(userId: string): Promise<string[]> {
  "use cache";
  cacheTag("wishlist", userId);
  cacheLife("minutes");

  const items = await db.query.wishlists.findMany({
    where: eq(wishlists.userId, userId),
    columns: { productId: true },
  });

  return items.map((i) => i.productId);
}
