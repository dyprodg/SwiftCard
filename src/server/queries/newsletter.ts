import { db } from "@/db";
import { newsletterSubscribers, emailCampaigns, campaignSends } from "@/db/schema";
import { orders } from "@/db/schema/orders";
import { eq, desc, and, sql, inArray, gte, isNotNull } from "drizzle-orm";
import { cacheTag, cacheLife } from "next/cache";

// ==================== SUBSCRIBERS ====================

type SubscriberFilters = {
  status?: "PENDING" | "ACTIVE" | "UNSUBSCRIBED";
  limit?: number;
  offset?: number;
};

export async function getSubscribers(filters: SubscriberFilters = {}) {
  "use cache";
  cacheTag("newsletter-subscribers");
  cacheLife("minutes");

  const conditions = [];
  if (filters.status) {
    conditions.push(eq(newsletterSubscribers.status, filters.status));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db.query.newsletterSubscribers.findMany({
      where,
      orderBy: [desc(newsletterSubscribers.createdAt)],
      limit: filters.limit ?? 20,
      offset: filters.offset ?? 0,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(newsletterSubscribers)
      .where(where),
  ]);

  return { items, total: Number(countResult[0].count) };
}

export async function getSubscriberStats() {
  "use cache";
  cacheTag("newsletter-subscribers");
  cacheLife("minutes");

  const [result] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${newsletterSubscribers.status} = 'ACTIVE')::int`,
      pending: sql<number>`count(*) filter (where ${newsletterSubscribers.status} = 'PENDING')::int`,
      unsubscribed: sql<number>`count(*) filter (where ${newsletterSubscribers.status} = 'UNSUBSCRIBED')::int`,
    })
    .from(newsletterSubscribers);

  return result;
}

// ==================== CAMPAIGNS ====================

type CampaignFilters = {
  status?: "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "CANCELLED";
  limit?: number;
  offset?: number;
};

export async function getCampaigns(filters: CampaignFilters = {}) {
  "use cache";
  cacheTag("email-campaigns");
  cacheLife("minutes");

  const conditions = [];
  if (filters.status) {
    conditions.push(eq(emailCampaigns.status, filters.status));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db.query.emailCampaigns.findMany({
      where,
      orderBy: [desc(emailCampaigns.createdAt)],
      limit: filters.limit ?? 20,
      offset: filters.offset ?? 0,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(emailCampaigns)
      .where(where),
  ]);

  return { items, total: Number(countResult[0].count) };
}

export async function getCampaignById(id: string) {
  "use cache";
  cacheTag("email-campaign", id);
  cacheLife("minutes");

  return db.query.emailCampaigns.findFirst({
    where: eq(emailCampaigns.id, id),
    with: {
      sends: {
        orderBy: [desc(campaignSends.sentAt)],
        limit: 100,
      },
    },
  });
}

export async function getCampaignStats() {
  "use cache";
  cacheTag("email-campaigns");
  cacheLife("minutes");

  const [result] = await db
    .select({
      totalCampaigns: sql<number>`count(*)::int`,
      totalSent: sql<number>`coalesce(sum(${emailCampaigns.totalSent}), 0)::int`,
      totalOpened: sql<number>`coalesce(sum(${emailCampaigns.totalOpened}), 0)::int`,
      totalClicked: sql<number>`coalesce(sum(${emailCampaigns.totalClicked}), 0)::int`,
    })
    .from(emailCampaigns)
    .where(eq(emailCampaigns.status, "SENT"));

  return {
    ...result,
    avgOpenRate:
      result.totalSent > 0
        ? Math.round((result.totalOpened / result.totalSent) * 100)
        : 0,
    avgClickRate:
      result.totalSent > 0
        ? Math.round((result.totalClicked / result.totalSent) * 100)
        : 0,
  };
}

// ==================== SEGMENT RESOLUTION ====================

export async function getSegmentRecipientCount(segment: string): Promise<number> {
  const subscribers = await resolveSegmentEmails(segment);
  return subscribers.length;
}

export async function resolveSegmentEmails(
  segment: string,
): Promise<{ id: string; email: string; unsubscribeToken: string }[]> {
  const activeSubscribers = await db
    .select({
      id: newsletterSubscribers.id,
      email: newsletterSubscribers.email,
      unsubscribeToken: newsletterSubscribers.unsubscribeToken,
    })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.status, "ACTIVE"));

  if (segment === "all_subscribers") {
    return activeSubscribers;
  }

  // Get emails that have paid orders
  const customerEmails = await db
    .select({ email: orders.customerEmail })
    .from(orders)
    .where(isNotNull(orders.paidAt))
    .groupBy(orders.customerEmail);

  const customerEmailSet = new Set(customerEmails.map((r) => r.email));

  if (segment === "customers_only") {
    return activeSubscribers.filter((s) => customerEmailSet.has(s.email));
  }

  if (segment === "high_value") {
    // Subscribers with lifetime order value > 500 CHF (50000 cents)
    const hvEmails = await db
      .select({
        email: orders.customerEmail,
        total: sql<number>`sum(${orders.total})::int`,
      })
      .from(orders)
      .where(isNotNull(orders.paidAt))
      .groupBy(orders.customerEmail)
      .having(sql`sum(${orders.total}) >= 50000`);

    const hvSet = new Set(hvEmails.map((r) => r.email));
    return activeSubscribers.filter((s) => hvSet.has(s.email));
  }

  if (segment === "recent_purchasers") {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEmails = await db
      .select({ email: orders.customerEmail })
      .from(orders)
      .where(and(isNotNull(orders.paidAt), gte(orders.paidAt, thirtyDaysAgo)))
      .groupBy(orders.customerEmail);

    const recentSet = new Set(recentEmails.map((r) => r.email));
    return activeSubscribers.filter((s) => recentSet.has(s.email));
  }

  return activeSubscribers;
}
