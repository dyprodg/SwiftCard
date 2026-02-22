import { db } from "@/db";
import { orders, products, productVariants } from "@/db/schema";
import { eq, sql, desc, and, lte } from "drizzle-orm";

export async function getDashboardMetrics() {
  const [revenueRow] = await db
    .select({
      revenue: sql<number>`coalesce(sum(${orders.total}), 0)`.as("revenue"),
      paidCount: sql<number>`count(*)`.as("paid_count"),
    })
    .from(orders)
    .where(eq(orders.paymentStatus, "PAID"));

  const [totalRow] = await db
    .select({
      count: sql<number>`count(*)`.as("count"),
    })
    .from(orders);

  const revenue = Number(revenueRow.revenue);
  const paidCount = Number(revenueRow.paidCount);
  const totalCount = Number(totalRow.count);
  const avgOrderValue = paidCount > 0 ? Math.round(revenue / paidCount) : 0;

  const ordersByStatus = await db
    .select({
      status: orders.status,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(orders)
    .groupBy(orders.status);

  const recentOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerEmail: orders.customerEmail,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      total: orders.total,
      currency: orders.currency,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(10);

  return {
    revenue,
    paidCount,
    totalCount,
    avgOrderValue,
    ordersByStatus: ordersByStatus.map((r) => ({
      status: r.status,
      count: Number(r.count),
    })),
    recentOrders,
  };
}

export async function getLowStockAlerts(threshold = 10) {
  const alerts = await db
    .select({
      variantId: productVariants.id,
      sku: productVariants.sku,
      size: productVariants.size,
      color: productVariants.color,
      stock: productVariants.stock,
      productName: products.name,
      productId: products.id,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(and(lte(productVariants.stock, threshold), eq(products.status, "ACTIVE")))
    .orderBy(productVariants.stock);

  return alerts;
}
