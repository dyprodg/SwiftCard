import { db } from "@/db";
import { stockReservations } from "@/db/schema/reservations";
import { productVariants } from "@/db/schema/products";
import { orders } from "@/db/schema/orders";
import { eq, desc, sql, and } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

type ReservationStatus = "RESERVED" | "CONVERTED" | "EXPIRED";

export async function getReservations(filters: {
  status?: ReservationStatus;
  page?: number;
  pageSize?: number;
}) {
  const { status, page = 1, pageSize = 20 } = filters;
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [];
  if (status) {
    conditions.push(eq(stockReservations.status, status));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: stockReservations.id,
        variantId: stockReservations.variantId,
        quantity: stockReservations.quantity,
        sessionId: stockReservations.sessionId,
        orderId: stockReservations.orderId,
        status: stockReservations.status,
        expiresAt: stockReservations.expiresAt,
        createdAt: stockReservations.createdAt,
        convertedAt: stockReservations.convertedAt,
        expiredAt: stockReservations.expiredAt,
        variantSku: productVariants.sku,
        variantSize: productVariants.size,
        variantColor: productVariants.color,
        orderNumber: orders.orderNumber,
      })
      .from(stockReservations)
      .leftJoin(productVariants, eq(stockReservations.variantId, productVariants.id))
      .leftJoin(orders, eq(stockReservations.orderId, orders.id))
      .where(where)
      .orderBy(desc(stockReservations.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(stockReservations)
      .where(where),
  ]);

  return {
    items,
    total: countResult[0]?.count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((countResult[0]?.count ?? 0) / pageSize),
  };
}

export async function getActiveReservationStats() {
  const [result] = await db
    .select({
      count: sql<number>`count(*)::int`,
      totalUnits: sql<number>`coalesce(sum(${stockReservations.quantity}), 0)::int`,
    })
    .from(stockReservations)
    .where(eq(stockReservations.status, "RESERVED"));

  return {
    activeCount: result?.count ?? 0,
    totalUnits: result?.totalUnits ?? 0,
  };
}
