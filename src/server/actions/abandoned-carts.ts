"use server";

import { db } from "@/db";
import { abandonedCarts } from "@/db/schema/customer-profiles";
import { eq, and, isNull, lte, sql } from "drizzle-orm";
import type { CartItem } from "@/types";

/**
 * Snapshot the current cart as an abandoned cart candidate.
 * Called when checkout form is submitted (before payment).
 * If payment succeeds, the cart is deleted; if not, the cron picks it up.
 */
export async function snapshotAbandonedCart(data: {
  sessionId: string;
  userId?: string | null;
  email: string;
  items: CartItem[];
  subtotal: number;
}) {
  // Upsert: update if same session already has an abandoned cart
  const [existing] = await db
    .select({ id: abandonedCarts.id })
    .from(abandonedCarts)
    .where(
      and(
        eq(abandonedCarts.sessionId, data.sessionId),
        isNull(abandonedCarts.recoveredAt),
      ),
    );

  if (existing) {
    await db
      .update(abandonedCarts)
      .set({
        email: data.email,
        items: data.items,
        subtotal: data.subtotal,
        abandonedAt: new Date(),
      })
      .where(eq(abandonedCarts.id, existing.id));
    return existing.id;
  }

  const [cart] = await db
    .insert(abandonedCarts)
    .values({
      sessionId: data.sessionId,
      userId: data.userId ?? null,
      email: data.email,
      items: data.items,
      subtotal: data.subtotal,
      abandonedAt: new Date(),
    })
    .returning({ id: abandonedCarts.id });

  return cart.id;
}

/**
 * Mark an abandoned cart as recovered (payment completed or cart restored).
 */
export async function markCartRecovered(sessionId: string) {
  await db
    .update(abandonedCarts)
    .set({ recoveredAt: new Date() })
    .where(
      and(eq(abandonedCarts.sessionId, sessionId), isNull(abandonedCarts.recoveredAt)),
    );
}

/**
 * Get an abandoned cart by recovery token (for recovery link).
 */
export async function getAbandonedCartByToken(token: string) {
  const [cart] = await db
    .select()
    .from(abandonedCarts)
    .where(
      and(eq(abandonedCarts.recoveryToken, token), isNull(abandonedCarts.recoveredAt)),
    );

  return cart ?? null;
}

/**
 * Find abandoned carts ready for email notification.
 * Criteria: abandoned > 1 hour ago, no email sent yet, not recovered, has email.
 */
export async function findCartsForRecoveryEmail(limit = 50) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  return db
    .select()
    .from(abandonedCarts)
    .where(
      and(
        lte(abandonedCarts.abandonedAt, oneHourAgo),
        isNull(abandonedCarts.emailSentAt),
        isNull(abandonedCarts.recoveredAt),
        sql`${abandonedCarts.email} IS NOT NULL`,
      ),
    )
    .limit(limit);
}

/**
 * Mark recovery email as sent.
 */
export async function markRecoveryEmailSent(id: string) {
  await db
    .update(abandonedCarts)
    .set({ emailSentAt: new Date() })
    .where(eq(abandonedCarts.id, id));
}
