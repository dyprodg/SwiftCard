"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { wishlists } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { updateTag } from "next/cache";
import { toggleWishlistSchema } from "@/lib/validations/wishlist";

export async function toggleWishlistItem(input: { productId: string }): Promise<{
  success: boolean;
  added?: boolean;
  error?: string;
}> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Sign in to use wishlist" };

  const { productId } = toggleWishlistSchema.parse(input);

  const existing = await db.query.wishlists.findFirst({
    where: and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)),
  });

  if (existing) {
    await db.delete(wishlists).where(eq(wishlists.id, existing.id));
    updateTag(`wishlist:${userId}`);
    return { success: true, added: false };
  }

  await db.insert(wishlists).values({ userId, productId });
  updateTag(`wishlist:${userId}`);
  return { success: true, added: true };
}

export async function removeWishlistItem(productId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Sign in required" };

  await db
    .delete(wishlists)
    .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)));

  updateTag(`wishlist:${userId}`);
  return { success: true };
}
