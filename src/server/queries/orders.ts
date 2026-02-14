"use server";

import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { eq, desc, sql, and, ilike, or } from "drizzle-orm";
import type { OrderWithItems } from "@/types";

type OrderFilters = {
  page?: number;
  pageSize?: number;
  status?: string;
  paymentStatus?: string;
  search?: string;
};

export async function getOrders(filters: OrderFilters = {}) {
  const { page = 1, pageSize = 20, status, paymentStatus, search } = filters;
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (status) {
    conditions.push(
      eq(orders.status, status as (typeof orders.status.enumValues)[number]),
    );
  }
  if (paymentStatus) {
    conditions.push(
      eq(
        orders.paymentStatus,
        paymentStatus as (typeof orders.paymentStatus.enumValues)[number],
      ),
    );
  }
  if (search) {
    conditions.push(
      or(
        ilike(orders.orderNumber, `%${search}%`),
        ilike(orders.customerEmail, `%${search}%`),
        ilike(orders.shippingName, `%${search}%`),
      ),
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(where),
  ]);

  return {
    orders: data,
    total: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function getOrderById(id: string): Promise<OrderWithItems | null> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { items: true },
  });

  return order ?? null;
}

export async function getOrdersByCustomer(
  customerEmail: string,
  opts: { page?: number; pageSize?: number } = {},
) {
  const { page = 1, pageSize = 10 } = opts;
  const offset = (page - 1) * pageSize;

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(eq(orders.customerEmail, customerEmail))
      .orderBy(desc(orders.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.customerEmail, customerEmail)),
  ]);

  return {
    orders: data,
    total: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}
