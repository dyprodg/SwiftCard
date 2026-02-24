import { db } from "@/db";
import {
  orders,
  orderItems,
  orderRefunds,
  products,
  categories,
  discounts,
} from "@/db/schema";
import { eq, sql, and, gte, lte, between } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DateRange = { dateFrom: string; dateTo: string };
export type Granularity = "day" | "week" | "month";

export type TimeSeriesPoint = {
  date: string;
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
};

export type SalesKPIs = {
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
  refundRate: number;
  previousRevenue: number;
  previousOrderCount: number;
  previousAvgOrderValue: number;
  previousRefundRate: number;
};

export type TopProduct = {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
};

export type CategoryRevenue = {
  categoryId: string | null;
  categoryName: string;
  revenue: number;
};

export type RefundTimeSeriesPoint = {
  date: string;
  amount: number;
  count: number;
};

export type RefundReason = {
  reason: string;
  count: number;
  amount: number;
};

export type RefundKPIs = {
  totalRefunded: number;
  refundCount: number;
  refundRate: number;
};

export type DiscountPerformance = {
  discountId: string;
  code: string | null;
  name: string;
  type: string;
  timesUsed: number;
  totalGiven: number;
  revenueGenerated: number;
};

export type CustomerBreakdown = {
  newCustomers: number;
  returningCustomers: number;
};

export type TopCustomer = {
  customerEmail: string;
  orderCount: number;
  totalSpent: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getGranularity(dateFrom: string, dateTo: string): Granularity {
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 60) return "day";
  if (diffDays <= 365) return "week";
  return "month";
}

function dateTruncExpr(granularity: Granularity) {
  return sql.raw(`date_trunc('${granularity}', orders.paid_at)`);
}

/** Compute the "previous period" date range with the same duration. */
function getPreviousPeriod(dateFrom: string, dateTo: string) {
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  const diffMs = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1); // day before dateFrom
  const prevFrom = new Date(prevTo.getTime() - diffMs);
  return {
    dateFrom: prevFrom.toISOString().slice(0, 10),
    dateTo: prevTo.toISOString().slice(0, 10),
  };
}

// ---------------------------------------------------------------------------
// 1. Revenue Time Series
// ---------------------------------------------------------------------------

export async function getRevenueTimeSeries(range: DateRange) {
  const granularity = getGranularity(range.dateFrom, range.dateTo);
  const truncExpr = dateTruncExpr(granularity);

  const rows = await db
    .select({
      date: sql<string>`${truncExpr}`.as("period"),
      revenue: sql<number>`coalesce(sum(${orders.total}), 0)`.as("revenue"),
      orderCount: sql<number>`count(*)`.as("order_count"),
      avgOrderValue: sql<number>`coalesce(avg(${orders.total}), 0)`.as("avg_order_value"),
    })
    .from(orders)
    .where(
      and(
        eq(orders.paymentStatus, "PAID"),
        gte(orders.paidAt, new Date(range.dateFrom)),
        lte(orders.paidAt, new Date(range.dateTo + "T23:59:59.999Z")),
      ),
    )
    .groupBy(sql`${truncExpr}`)
    .orderBy(sql`${truncExpr}`);

  return rows.map((r) => ({
    date: new Date(r.date).toISOString().slice(0, 10),
    revenue: Number(r.revenue),
    orderCount: Number(r.orderCount),
    avgOrderValue: Math.round(Number(r.avgOrderValue)),
  })) satisfies TimeSeriesPoint[];
}

// ---------------------------------------------------------------------------
// 2. Sales KPIs (current + previous period for delta)
// ---------------------------------------------------------------------------

async function getPeriodKPIs(dateFrom: string, dateTo: string) {
  const [row] = await db
    .select({
      revenue: sql<number>`coalesce(sum(${orders.total}), 0)`.as("revenue"),
      orderCount: sql<number>`count(*)`.as("order_count"),
      avgOrderValue: sql<number>`coalesce(avg(${orders.total}), 0)`.as("avg_order_value"),
    })
    .from(orders)
    .where(
      and(
        eq(orders.paymentStatus, "PAID"),
        gte(orders.paidAt, new Date(dateFrom)),
        lte(orders.paidAt, new Date(dateTo + "T23:59:59.999Z")),
      ),
    );

  const [refundRow] = await db
    .select({
      refundedOrders: sql<number>`count(distinct ${orders.id})`.as("refunded_orders"),
    })
    .from(orders)
    .innerJoin(orderRefunds, eq(orderRefunds.orderId, orders.id))
    .where(
      and(
        eq(orders.paymentStatus, "PAID"),
        gte(orders.paidAt, new Date(dateFrom)),
        lte(orders.paidAt, new Date(dateTo + "T23:59:59.999Z")),
      ),
    );

  const orderCount = Number(row.orderCount);
  const refundedOrders = Number(refundRow.refundedOrders);

  return {
    revenue: Number(row.revenue),
    orderCount,
    avgOrderValue: Math.round(Number(row.avgOrderValue)),
    refundRate: orderCount > 0 ? (refundedOrders / orderCount) * 100 : 0,
  };
}

export async function getSalesKPIs(range: DateRange): Promise<SalesKPIs> {
  const prev = getPreviousPeriod(range.dateFrom, range.dateTo);
  const [current, previous] = await Promise.all([
    getPeriodKPIs(range.dateFrom, range.dateTo),
    getPeriodKPIs(prev.dateFrom, prev.dateTo),
  ]);

  return {
    revenue: current.revenue,
    orderCount: current.orderCount,
    avgOrderValue: current.avgOrderValue,
    refundRate: current.refundRate,
    previousRevenue: previous.revenue,
    previousOrderCount: previous.orderCount,
    previousAvgOrderValue: previous.avgOrderValue,
    previousRefundRate: previous.refundRate,
  };
}

// ---------------------------------------------------------------------------
// 3. Top Products
// ---------------------------------------------------------------------------

export async function getTopProducts(range: DateRange): Promise<TopProduct[]> {
  const rows = await db
    .select({
      productId: orderItems.productId,
      productName: orderItems.productName,
      unitsSold: sql<number>`sum(${orderItems.quantity})`.as("units_sold"),
      revenue: sql<number>`sum(${orderItems.total})`.as("revenue"),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(
      and(
        eq(orders.paymentStatus, "PAID"),
        gte(orders.paidAt, new Date(range.dateFrom)),
        lte(orders.paidAt, new Date(range.dateTo + "T23:59:59.999Z")),
      ),
    )
    .groupBy(orderItems.productId, orderItems.productName)
    .orderBy(sql`revenue DESC`)
    .limit(10);

  return rows.map((r) => ({
    productId: r.productId,
    productName: r.productName,
    unitsSold: Number(r.unitsSold),
    revenue: Number(r.revenue),
  }));
}

// ---------------------------------------------------------------------------
// 4. Revenue by Category
// ---------------------------------------------------------------------------

export async function getRevenueByCategory(range: DateRange): Promise<CategoryRevenue[]> {
  const rows = await db
    .select({
      categoryId: products.categoryId,
      categoryName: sql<string>`coalesce(${categories.name}, 'Uncategorized')`.as(
        "category_name",
      ),
      revenue: sql<number>`sum(${orderItems.total})`.as("revenue"),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(products, eq(products.id, orderItems.productId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(
      and(
        eq(orders.paymentStatus, "PAID"),
        gte(orders.paidAt, new Date(range.dateFrom)),
        lte(orders.paidAt, new Date(range.dateTo + "T23:59:59.999Z")),
      ),
    )
    .groupBy(products.categoryId, categories.name)
    .orderBy(sql`revenue DESC`);

  return rows.map((r) => ({
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    revenue: Number(r.revenue),
  }));
}

// ---------------------------------------------------------------------------
// 5. Refund Time Series
// ---------------------------------------------------------------------------

export async function getRefundTimeSeries(
  range: DateRange,
): Promise<RefundTimeSeriesPoint[]> {
  const granularity = getGranularity(range.dateFrom, range.dateTo);
  const truncExpr = sql.raw(`date_trunc('${granularity}', order_refunds.created_at)`);

  const rows = await db
    .select({
      date: sql<string>`${truncExpr}`.as("period"),
      amount: sql<number>`coalesce(sum(${orderRefunds.amount}), 0)`.as("amount"),
      count: sql<number>`count(*)`.as("count"),
    })
    .from(orderRefunds)
    .where(
      between(
        orderRefunds.createdAt,
        new Date(range.dateFrom),
        new Date(range.dateTo + "T23:59:59.999Z"),
      ),
    )
    .groupBy(sql`${truncExpr}`)
    .orderBy(sql`${truncExpr}`);

  return rows.map((r) => ({
    date: new Date(r.date).toISOString().slice(0, 10),
    amount: Number(r.amount),
    count: Number(r.count),
  }));
}

// ---------------------------------------------------------------------------
// 6. Refund Reasons
// ---------------------------------------------------------------------------

export async function getRefundReasons(range: DateRange): Promise<RefundReason[]> {
  const rows = await db
    .select({
      reason: orderRefunds.reason,
      count: sql<number>`count(*)`.as("count"),
      amount: sql<number>`coalesce(sum(${orderRefunds.amount}), 0)`.as("amount"),
    })
    .from(orderRefunds)
    .where(
      between(
        orderRefunds.createdAt,
        new Date(range.dateFrom),
        new Date(range.dateTo + "T23:59:59.999Z"),
      ),
    )
    .groupBy(orderRefunds.reason)
    .orderBy(sql`count DESC`);

  return rows.map((r) => ({
    reason: r.reason,
    count: Number(r.count),
    amount: Number(r.amount),
  }));
}

// ---------------------------------------------------------------------------
// 7. Refund Rate (for refund tab KPIs)
// ---------------------------------------------------------------------------

export async function getRefundKPIs(range: DateRange): Promise<RefundKPIs> {
  const [refundRow] = await db
    .select({
      totalRefunded: sql<number>`coalesce(sum(${orderRefunds.amount}), 0)`.as(
        "total_refunded",
      ),
      refundCount: sql<number>`count(*)`.as("refund_count"),
    })
    .from(orderRefunds)
    .where(
      between(
        orderRefunds.createdAt,
        new Date(range.dateFrom),
        new Date(range.dateTo + "T23:59:59.999Z"),
      ),
    );

  const [orderRow] = await db
    .select({
      paidCount: sql<number>`count(*)`.as("paid_count"),
    })
    .from(orders)
    .where(
      and(
        eq(orders.paymentStatus, "PAID"),
        gte(orders.paidAt, new Date(range.dateFrom)),
        lte(orders.paidAt, new Date(range.dateTo + "T23:59:59.999Z")),
      ),
    );

  const [refundedOrderRow] = await db
    .select({
      refundedOrders: sql<number>`count(distinct ${orderRefunds.orderId})`.as(
        "refunded_orders",
      ),
    })
    .from(orderRefunds)
    .where(
      between(
        orderRefunds.createdAt,
        new Date(range.dateFrom),
        new Date(range.dateTo + "T23:59:59.999Z"),
      ),
    );

  const paidCount = Number(orderRow.paidCount);
  const refundedOrders = Number(refundedOrderRow.refundedOrders);

  return {
    totalRefunded: Number(refundRow.totalRefunded),
    refundCount: Number(refundRow.refundCount),
    refundRate: paidCount > 0 ? (refundedOrders / paidCount) * 100 : 0,
  };
}

// ---------------------------------------------------------------------------
// 8. Discount Performance
// ---------------------------------------------------------------------------

export async function getDiscountPerformance(
  range: DateRange,
): Promise<DiscountPerformance[]> {
  const rows = await db
    .select({
      discountId: discounts.id,
      code: discounts.code,
      name: discounts.name,
      type: discounts.type,
      timesUsed: sql<number>`count(${orders.id})`.as("times_used"),
      totalGiven: sql<number>`coalesce(sum(${orders.discountAmount}), 0)`.as(
        "total_given",
      ),
      revenueGenerated: sql<number>`coalesce(sum(${orders.total}), 0)`.as(
        "revenue_generated",
      ),
    })
    .from(discounts)
    .innerJoin(
      orders,
      and(
        eq(orders.discountId, discounts.id),
        eq(orders.paymentStatus, "PAID"),
        gte(orders.paidAt, new Date(range.dateFrom)),
        lte(orders.paidAt, new Date(range.dateTo + "T23:59:59.999Z")),
      ),
    )
    .groupBy(discounts.id, discounts.code, discounts.name, discounts.type)
    .orderBy(sql`times_used DESC`);

  return rows.map((r) => ({
    discountId: r.discountId,
    code: r.code,
    name: r.name,
    type: r.type,
    timesUsed: Number(r.timesUsed),
    totalGiven: Number(r.totalGiven),
    revenueGenerated: Number(r.revenueGenerated),
  }));
}

// ---------------------------------------------------------------------------
// 9. Customer Breakdown (new vs returning)
// ---------------------------------------------------------------------------

export async function getCustomerBreakdown(range: DateRange): Promise<CustomerBreakdown> {
  // Get all unique customer emails who placed paid orders in this period
  const periodCustomers = await db
    .select({
      customerEmail: orders.customerEmail,
    })
    .from(orders)
    .where(
      and(
        eq(orders.paymentStatus, "PAID"),
        gte(orders.paidAt, new Date(range.dateFrom)),
        lte(orders.paidAt, new Date(range.dateTo + "T23:59:59.999Z")),
      ),
    )
    .groupBy(orders.customerEmail);

  if (periodCustomers.length === 0) {
    return { newCustomers: 0, returningCustomers: 0 };
  }

  // Count customers who had a paid order BEFORE the date range
  const [returningRow] = await db
    .select({
      count: sql<number>`count(distinct ${orders.customerEmail})`.as("count"),
    })
    .from(orders)
    .where(
      and(
        eq(orders.paymentStatus, "PAID"),
        sql`${orders.paidAt} < ${new Date(range.dateFrom)}`,
        sql`${orders.customerEmail} IN (${sql.join(
          periodCustomers.map((c) => sql`${c.customerEmail}`),
          sql`, `,
        )})`,
      ),
    );

  const returningCustomers = Number(returningRow.count);
  const newCustomers = periodCustomers.length - returningCustomers;

  return { newCustomers, returningCustomers };
}

// ---------------------------------------------------------------------------
// 10. Top Customers
// ---------------------------------------------------------------------------

export async function getTopCustomers(range: DateRange): Promise<TopCustomer[]> {
  const rows = await db
    .select({
      customerEmail: orders.customerEmail,
      orderCount: sql<number>`count(*)`.as("order_count"),
      totalSpent: sql<number>`sum(${orders.total})`.as("total_spent"),
    })
    .from(orders)
    .where(
      and(
        eq(orders.paymentStatus, "PAID"),
        gte(orders.paidAt, new Date(range.dateFrom)),
        lte(orders.paidAt, new Date(range.dateTo + "T23:59:59.999Z")),
      ),
    )
    .groupBy(orders.customerEmail)
    .orderBy(sql`total_spent DESC`)
    .limit(10);

  return rows.map((r) => ({
    customerEmail: r.customerEmail,
    orderCount: Number(r.orderCount),
    totalSpent: Number(r.totalSpent),
  }));
}
