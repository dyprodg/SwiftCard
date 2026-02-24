"use server";

import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { orderEvents } from "@/db/schema/order-events";
import { eq, desc, sql, and, ilike, or, gte, lte } from "drizzle-orm";
import type {
  OrderWithItems,
  OrderWithItemsAndRefunds,
  OrderWithItemsAndRefundsAndFulfillments,
  OrderEvent,
} from "@/types";

export type OrderFilters = {
  page?: number;
  pageSize?: number;
  status?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
};

export async function getOrders(filters: OrderFilters = {}) {
  const {
    page = 1,
    pageSize = 20,
    status,
    paymentStatus,
    fulfillmentStatus,
    search,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
  } = filters;
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
  if (fulfillmentStatus) {
    conditions.push(
      eq(
        orders.fulfillmentStatus,
        fulfillmentStatus as (typeof orders.fulfillmentStatus.enumValues)[number],
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
  if (dateFrom) {
    conditions.push(gte(orders.createdAt, new Date(dateFrom)));
  }
  if (dateTo) {
    // Include the entire end date by adding a day
    const endDate = new Date(dateTo);
    endDate.setDate(endDate.getDate() + 1);
    conditions.push(lte(orders.createdAt, endDate));
  }
  if (amountMin !== undefined && amountMin > 0) {
    conditions.push(gte(orders.total, amountMin));
  }
  if (amountMax !== undefined && amountMax > 0) {
    conditions.push(lte(orders.total, amountMax));
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

export async function getOrderByIdWithRefunds(
  id: string,
): Promise<OrderWithItemsAndRefunds | null> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      items: true,
      refunds: { with: { items: true } },
    },
  });

  return order ?? null;
}

export async function getOrderByIdFull(
  id: string,
): Promise<OrderWithItemsAndRefundsAndFulfillments | null> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      items: true,
      refunds: { with: { items: true } },
      fulfillments: { with: { items: true } },
    },
  });

  return order ?? null;
}

export async function getOrderEvents(orderId: string): Promise<OrderEvent[]> {
  return db
    .select()
    .from(orderEvents)
    .where(eq(orderEvents.orderId, orderId))
    .orderBy(desc(orderEvents.createdAt));
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
