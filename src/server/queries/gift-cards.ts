import { db } from "@/db";
import { giftCards, giftCardTransactions } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { cacheTag, cacheLife } from "next/cache";

type GiftCardFilters = {
  status?: "ACTIVE" | "DISABLED" | "FULLY_REDEEMED" | "EXPIRED";
  limit?: number;
  offset?: number;
};

export async function getGiftCards(filters: GiftCardFilters = {}) {
  "use cache";
  cacheTag("gift-cards");
  cacheLife("minutes");

  const conditions = [];
  if (filters.status) {
    conditions.push(eq(giftCards.status, filters.status));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db.query.giftCards.findMany({
      where,
      with: { transactions: true },
      orderBy: [desc(giftCards.createdAt)],
      limit: filters.limit ?? 20,
      offset: filters.offset ?? 0,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(giftCards)
      .where(where),
  ]);

  return { items, total: Number(countResult[0].count) };
}

export async function getGiftCardById(id: string) {
  "use cache";
  cacheTag("gift-card", id);
  cacheLife("minutes");

  return db.query.giftCards.findFirst({
    where: eq(giftCards.id, id),
    with: {
      transactions: {
        orderBy: [desc(giftCardTransactions.createdAt)],
      },
    },
  });
}

export async function getGiftCardByCode(code: string) {
  "use cache";
  cacheTag("gift-card-code", code);
  cacheLife("seconds");

  return db.query.giftCards.findFirst({
    where: eq(giftCards.code, code),
  });
}

export async function getGiftCardStats() {
  "use cache";
  cacheTag("gift-cards");
  cacheLife("minutes");

  const [result] = await db
    .select({
      totalIssued: sql<number>`count(*)::int`,
      totalActive: sql<number>`count(*) filter (where ${giftCards.status} = 'ACTIVE')::int`,
      outstandingBalance: sql<number>`coalesce(sum(${giftCards.currentBalance}) filter (where ${giftCards.status} = 'ACTIVE'), 0)::int`,
      totalRedeemed: sql<number>`coalesce(sum(${giftCards.initialBalance} - ${giftCards.currentBalance}), 0)::int`,
    })
    .from(giftCards);

  return result;
}

export async function getGiftCardsByEmail(email: string) {
  "use cache";
  cacheTag("gift-cards");
  cacheLife("minutes");

  return db.query.giftCards.findMany({
    where: eq(giftCards.recipientEmail, email),
    with: {
      transactions: {
        orderBy: [desc(giftCardTransactions.createdAt)],
      },
    },
    orderBy: [desc(giftCards.createdAt)],
  });
}
