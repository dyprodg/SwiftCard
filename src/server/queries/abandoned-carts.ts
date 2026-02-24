import { db } from "@/db";
import { abandonedCarts } from "@/db/schema/customer-profiles";
import { desc, sql, isNull, isNotNull, and } from "drizzle-orm";

export async function getAbandonedCartsForAdmin() {
  const carts = await db
    .select()
    .from(abandonedCarts)
    .orderBy(desc(abandonedCarts.abandonedAt))
    .limit(200);

  return carts;
}

export async function getAbandonedCartStats() {
  const [stats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      notRecovered: sql<number>`count(*) FILTER (WHERE ${abandonedCarts.recoveredAt} IS NULL)::int`,
      recovered: sql<number>`count(*) FILTER (WHERE ${abandonedCarts.recoveredAt} IS NOT NULL)::int`,
      emailSent: sql<number>`count(*) FILTER (WHERE ${abandonedCarts.emailSentAt} IS NOT NULL)::int`,
      totalLostRevenue: sql<number>`coalesce(sum(${abandonedCarts.subtotal}) FILTER (WHERE ${abandonedCarts.recoveredAt} IS NULL), 0)::int`,
      totalRecoveredRevenue: sql<number>`coalesce(sum(${abandonedCarts.subtotal}) FILTER (WHERE ${abandonedCarts.recoveredAt} IS NOT NULL), 0)::int`,
    })
    .from(abandonedCarts);

  return {
    total: stats?.total ?? 0,
    notRecovered: stats?.notRecovered ?? 0,
    recovered: stats?.recovered ?? 0,
    emailSent: stats?.emailSent ?? 0,
    totalLostRevenue: stats?.totalLostRevenue ?? 0,
    totalRecoveredRevenue: stats?.totalRecoveredRevenue ?? 0,
    recoveryRate:
      stats && stats.total > 0 ? Math.round((stats.recovered / stats.total) * 100) : 0,
  };
}
