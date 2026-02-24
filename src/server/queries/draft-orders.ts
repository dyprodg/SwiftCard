"use server";

import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { eq, desc, and, sql } from "drizzle-orm";
import type { OrderWithItems } from "@/types";

export async function getDraftOrders() {
  return db.query.orders.findMany({
    where: eq(orders.status, "DRAFT"),
    with: { items: true },
    orderBy: [desc(orders.createdAt)],
  });
}

export async function getDraftOrderById(id: string): Promise<OrderWithItems | null> {
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, id), eq(orders.status, "DRAFT")),
    with: { items: true },
  });

  return order ?? null;
}

export async function getNextOrderNumber(): Promise<string> {
  const { generateOrderNumber } = await import("@/lib/utils/order-number");
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders);
  return generateOrderNumber((countResult?.count ?? 0) + 1);
}
