import { db } from "@/db";
import { orders, orderItems } from "@/db/schema/orders";
import { customerAddresses } from "@/db/schema/customer-profiles";
import { wishlists, productReviews } from "@/db/schema/customer-features";
import { products } from "@/db/schema/products";
import { eq, sql, desc } from "drizzle-orm";

export async function getCustomerDetailByEmail(email: string) {
  // Get all orders for this customer
  const customerOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerEmail, email))
    .orderBy(desc(orders.createdAt));

  // Aggregate stats
  const [stats] = await db
    .select({
      orderCount: sql<number>`count(*)::int`,
      totalSpent: sql<number>`coalesce(sum(${orders.total}), 0)::int`,
      totalRefunded: sql<number>`coalesce(sum(${orders.totalRefunded}), 0)::int`,
      firstOrderDate: sql<Date | null>`min(${orders.createdAt})`,
      lastOrderDate: sql<Date | null>`max(${orders.createdAt})`,
      avgOrderValue: sql<number>`coalesce(avg(${orders.total}), 0)::int`,
    })
    .from(orders)
    .where(eq(orders.customerEmail, email));

  return {
    orders: customerOrders,
    stats: {
      orderCount: stats?.orderCount ?? 0,
      totalSpent: stats?.totalSpent ?? 0,
      totalRefunded: stats?.totalRefunded ?? 0,
      firstOrderDate: stats?.firstOrderDate ?? null,
      lastOrderDate: stats?.lastOrderDate ?? null,
      avgOrderValue: stats?.avgOrderValue ?? 0,
    },
  };
}

export async function getCustomerAddressesByUserId(userId: string) {
  return db
    .select()
    .from(customerAddresses)
    .where(eq(customerAddresses.userId, userId))
    .orderBy(customerAddresses.createdAt);
}

export async function getCustomerReviewsByUserId(userId: string) {
  return db
    .select({
      review: productReviews,
      productName: products.name,
      productSlug: products.slug,
    })
    .from(productReviews)
    .leftJoin(products, eq(productReviews.productId, products.id))
    .where(eq(productReviews.userId, userId))
    .orderBy(desc(productReviews.createdAt));
}

export async function getCustomerWishlistByUserId(userId: string) {
  return db
    .select({
      wishlist: wishlists,
      productName: products.name,
      productSlug: products.slug,
    })
    .from(wishlists)
    .leftJoin(products, eq(wishlists.productId, products.id))
    .where(eq(wishlists.userId, userId))
    .orderBy(desc(wishlists.createdAt));
}
