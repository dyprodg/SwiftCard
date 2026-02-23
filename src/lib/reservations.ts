import { db } from "@/db";
import { stockReservations } from "@/db/schema/reservations";
import { productVariants } from "@/db/schema/products";
import { orders } from "@/db/schema/orders";
import { eq, and, sql, lte, inArray } from "drizzle-orm";
import type { Database } from "@/db";

type TransactionClient = Parameters<Parameters<Database["transaction"]>[0]>[0];

type ReservationItem = {
  variantId: string | null;
  quantity: number;
  productName?: string;
};

/**
 * Decrement stock + insert RESERVED rows inside an existing transaction.
 * Called by checkout and retry-payment routes.
 */
export async function createReservationsInTx(
  tx: TransactionClient,
  items: ReservationItem[],
  sessionId: string,
  orderId: string,
  timeoutMinutes = 15,
) {
  const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);

  for (const item of items) {
    if (!item.variantId) continue;

    // Atomic stock decrement with availability check
    const result = await tx
      .update(productVariants)
      .set({
        stock: sql`${productVariants.stock} - ${item.quantity}`,
      })
      .where(
        sql`${productVariants.id} = ${item.variantId} AND ${productVariants.stock} >= ${item.quantity}`,
      )
      .returning();

    if (result.length === 0) {
      throw new Error(`Not enough stock for "${item.productName ?? "product"}"`);
    }

    // Insert reservation row
    await tx.insert(stockReservations).values({
      variantId: item.variantId,
      quantity: item.quantity,
      sessionId,
      orderId,
      status: "RESERVED",
      expiresAt,
    });
  }
}

/**
 * Mark all RESERVED reservations for an order as CONVERTED.
 * Called on payment_intent.succeeded + reconciliation.
 * Idempotent — calling on already-converted rows is a no-op.
 */
export async function convertReservations(orderId: string) {
  await db
    .update(stockReservations)
    .set({
      status: "CONVERTED",
      convertedAt: new Date(),
    })
    .where(
      and(
        eq(stockReservations.orderId, orderId),
        eq(stockReservations.status, "RESERVED"),
      ),
    );
}

/**
 * Restore stock and mark RESERVED reservations as EXPIRED for an order.
 * Called on payment_intent.payment_failed + reconciliation cleanup.
 * Idempotent — calling on already-expired rows is a no-op.
 */
export async function expireReservations(orderId: string) {
  const reserved = await db
    .select()
    .from(stockReservations)
    .where(
      and(
        eq(stockReservations.orderId, orderId),
        eq(stockReservations.status, "RESERVED"),
      ),
    );

  if (reserved.length === 0) return;

  // Restore stock for each reservation
  for (const reservation of reserved) {
    await db
      .update(productVariants)
      .set({
        stock: sql`${productVariants.stock} + ${reservation.quantity}`,
      })
      .where(eq(productVariants.id, reservation.variantId));
  }

  // Mark as expired
  await db
    .update(stockReservations)
    .set({
      status: "EXPIRED",
      expiredAt: new Date(),
    })
    .where(
      and(
        eq(stockReservations.orderId, orderId),
        eq(stockReservations.status, "RESERVED"),
      ),
    );
}

/**
 * Find and expire stale reservations (past expiresAt) where the order
 * is still PENDING or FAILED. Restores stock for each.
 * Called by the cron job every 5 minutes.
 *
 * Safety: only expires if the order hasn't been paid yet, preventing
 * race conditions with late-arriving success webhooks.
 */
export async function expireStaleReservations(): Promise<{
  expired: number;
  stockRestored: number;
}> {
  const now = new Date();

  // Find stale RESERVED reservations joined with order status
  const stale = await db
    .select({
      reservationId: stockReservations.id,
      variantId: stockReservations.variantId,
      quantity: stockReservations.quantity,
      orderId: stockReservations.orderId,
    })
    .from(stockReservations)
    .innerJoin(orders, eq(stockReservations.orderId, orders.id))
    .where(
      and(
        eq(stockReservations.status, "RESERVED"),
        lte(stockReservations.expiresAt, now),
        inArray(orders.paymentStatus, ["PENDING", "FAILED"]),
      ),
    );

  if (stale.length === 0) {
    return { expired: 0, stockRestored: 0 };
  }

  let stockRestored = 0;

  // Restore stock for each stale reservation
  for (const row of stale) {
    await db
      .update(productVariants)
      .set({
        stock: sql`${productVariants.stock} + ${row.quantity}`,
      })
      .where(eq(productVariants.id, row.variantId));

    stockRestored += row.quantity;
  }

  // Mark all as expired
  const staleIds = stale.map((r) => r.reservationId);
  await db
    .update(stockReservations)
    .set({
      status: "EXPIRED",
      expiredAt: now,
    })
    .where(inArray(stockReservations.id, staleIds));

  return { expired: stale.length, stockRestored };
}
