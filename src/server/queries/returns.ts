import { db } from "@/db";
import { returns, returnItems } from "@/db/schema/returns";
import { orders, orderRefunds, orderRefundItems } from "@/db/schema/orders";
import { eq, desc, and, inArray, count, sql } from "drizzle-orm";
import { getReturnSettings } from "@/lib/edge-config";

export async function getReturnsByOrder(orderId: string) {
  return db.query.returns.findMany({
    where: eq(returns.orderId, orderId),
    with: { items: true },
    orderBy: [desc(returns.createdAt)],
  });
}

export async function getReturnById(returnId: string) {
  return db.query.returns.findFirst({
    where: eq(returns.id, returnId),
    with: {
      items: true,
      order: {
        with: {
          items: true,
          refunds: { with: { items: true } },
        },
      },
    },
  });
}

export async function getAdminReturns(filters?: { status?: string }) {
  const conditions = [];
  if (filters?.status) {
    conditions.push(
      eq(
        returns.status,
        filters.status as "REQUESTED" | "APPROVED" | "RECEIVED" | "REFUNDED" | "REJECTED",
      ),
    );
  }

  const items = await db.query.returns.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      items: true,
      order: { columns: { orderNumber: true, customerEmail: true } },
    },
    orderBy: [desc(returns.createdAt)],
    limit: 100,
  });

  return items;
}

export async function getReturnStats() {
  const rows = await db
    .select({
      status: returns.status,
      count: count(),
    })
    .from(returns)
    .groupBy(returns.status);

  const stats: Record<string, number> = {
    REQUESTED: 0,
    APPROVED: 0,
    RECEIVED: 0,
    REFUNDED: 0,
    REJECTED: 0,
  };

  for (const row of rows) {
    stats[row.status] = row.count;
  }

  return stats;
}

/**
 * Checks whether a customer can request a return for a given order.
 * Returns { eligible: true } or { eligible: false, reason: string }.
 */
export async function canRequestReturn(
  orderId: string,
  opts: { customerId?: string; customerEmail?: string },
): Promise<{ eligible: true } | { eligible: false; reason: string }> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: {
      id: true,
      customerId: true,
      customerEmail: true,
      status: true,
      paymentStatus: true,
      deliveredAt: true,
      paidAt: true,
    },
  });

  if (!order) {
    return { eligible: false, reason: "ORDER_NOT_FOUND" };
  }

  // Ownership check: match by customerId OR by email
  const ownerById = opts.customerId && order.customerId === opts.customerId;
  const ownerByEmail = opts.customerEmail && order.customerEmail === opts.customerEmail;
  if (!ownerById && !ownerByEmail) {
    return { eligible: false, reason: "NOT_YOUR_ORDER" };
  }

  if (order.status !== "DELIVERED" && order.status !== "SHIPPED") {
    return { eligible: false, reason: "ORDER_NOT_ELIGIBLE" };
  }

  if (order.paymentStatus !== "PAID" && order.paymentStatus !== "PARTIALLY_REFUNDED") {
    return { eligible: false, reason: "PAYMENT_NOT_ELIGIBLE" };
  }

  // Check return window
  const settings = await getReturnSettings();
  if (!settings.enabled) {
    return { eligible: false, reason: "RETURNS_DISABLED" };
  }

  const referenceDate = order.deliveredAt ?? order.paidAt;
  if (referenceDate) {
    const windowEnd = new Date(referenceDate);
    windowEnd.setDate(windowEnd.getDate() + settings.returnWindowDays);
    if (new Date() > windowEnd) {
      return { eligible: false, reason: "RETURN_WINDOW_EXPIRED" };
    }
  }

  // Check for active returns (REQUESTED or APPROVED)
  const activeReturns = await db
    .select({ id: returns.id })
    .from(returns)
    .where(
      and(
        eq(returns.orderId, orderId),
        inArray(returns.status, ["REQUESTED", "APPROVED"]),
      ),
    )
    .limit(1);

  if (activeReturns.length > 0) {
    return { eligible: false, reason: "ACTIVE_RETURN_EXISTS" };
  }

  return { eligible: true };
}

/**
 * Calculate how many units of each order item have already been returned
 * (in REQUESTED/APPROVED/RECEIVED/REFUNDED returns — not REJECTED).
 */
export async function getReturnedQuantities(orderId: string) {
  const orderReturns = await db.query.returns.findMany({
    where: and(eq(returns.orderId, orderId), sql`${returns.status} != 'REJECTED'`),
    with: { items: true },
  });

  const quantities: Record<string, number> = {};
  for (const r of orderReturns) {
    for (const item of r.items) {
      quantities[item.orderItemId] = (quantities[item.orderItemId] ?? 0) + item.quantity;
    }
  }
  return quantities;
}
