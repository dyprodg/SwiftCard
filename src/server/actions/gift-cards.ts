"use server";

import { db } from "@/db";
import { giftCards, giftCardTransactions } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import {
  createGiftCardSchema,
  updateGiftCardSchema,
  adjustBalanceSchema,
  redeemGiftCardSchema,
  type CreateGiftCardInput,
  type UpdateGiftCardInput,
  type AdjustBalanceInput,
} from "@/lib/validations/gift-card";
import { generateGiftCardCode, normalizeGiftCardCode } from "@/lib/utils/gift-card-code";

async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") throw new Error("Unauthorized");
  return userId;
}

// ==================== ADMIN CRUD ====================

export async function createGiftCard(input: CreateGiftCardInput) {
  const adminId = await requireAdmin();
  const data = createGiftCardSchema.parse(input);
  const code = generateGiftCardCode();

  return db.transaction(async (tx) => {
    const [card] = await tx
      .insert(giftCards)
      .values({
        code,
        initialBalance: data.initialBalance,
        currentBalance: data.initialBalance,
        status: "ACTIVE",
        recipientEmail: data.recipientEmail || null,
        recipientName: data.recipientName || null,
        senderName: data.senderName || null,
        personalMessage: data.personalMessage || null,
        issuedByAdmin: adminId,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      })
      .returning();

    // Create initial PURCHASE transaction
    await tx.insert(giftCardTransactions).values({
      giftCardId: card.id,
      type: "PURCHASE",
      amount: data.initialBalance,
      balanceAfter: data.initialBalance,
      note: data.note || "Admin-issued gift card",
      createdBy: adminId,
    });

    updateTag("gift-cards");
    return card;
  });
}

export async function updateGiftCard(input: UpdateGiftCardInput) {
  await requireAdmin();
  const data = updateGiftCardSchema.parse(input);
  const { id, ...updates } = data;

  const setData: Record<string, unknown> = {};
  if (updates.status !== undefined) setData.status = updates.status;
  if (updates.expiresAt !== undefined) {
    setData.expiresAt = updates.expiresAt ? new Date(updates.expiresAt) : null;
  }

  if (Object.keys(setData).length > 0) {
    await db.update(giftCards).set(setData).where(eq(giftCards.id, id));
  }

  updateTag("gift-cards");
  updateTag("gift-card");
}

export async function adjustGiftCardBalance(input: AdjustBalanceInput) {
  const adminId = await requireAdmin();
  const data = adjustBalanceSchema.parse(input);

  return db.transaction(async (tx) => {
    const [card] = await tx
      .select()
      .from(giftCards)
      .where(eq(giftCards.id, data.giftCardId));

    if (!card) throw new Error("Gift card not found");

    const newBalance = card.currentBalance + data.amount;
    if (newBalance < 0) throw new Error("Balance cannot go below zero");

    await tx
      .update(giftCards)
      .set({
        currentBalance: newBalance,
        status: newBalance === 0 ? "FULLY_REDEEMED" : "ACTIVE",
      })
      .where(eq(giftCards.id, data.giftCardId));

    await tx.insert(giftCardTransactions).values({
      giftCardId: data.giftCardId,
      type: "ADJUSTMENT",
      amount: data.amount,
      balanceAfter: newBalance,
      note: data.note,
      createdBy: adminId,
    });

    updateTag("gift-cards");
    updateTag("gift-card");
    return { newBalance };
  });
}

export async function disableGiftCard(id: string) {
  await requireAdmin();

  await db.update(giftCards).set({ status: "DISABLED" }).where(eq(giftCards.id, id));

  updateTag("gift-cards");
  updateTag("gift-card");
}

// ==================== STOREFRONT ====================

export async function validateGiftCardCode(rawCode: string) {
  const parsed = redeemGiftCardSchema.safeParse({ code: rawCode });
  if (!parsed.success) {
    return { valid: false as const, error: "Invalid code format" };
  }

  const code = parsed.data.code;
  const card = await db.query.giftCards.findFirst({
    where: eq(giftCards.code, code),
  });

  if (!card) {
    return { valid: false as const, error: "Gift card not found" };
  }

  if (card.status === "DISABLED") {
    return { valid: false as const, error: "Gift card is disabled" };
  }

  if (card.status === "FULLY_REDEEMED") {
    return { valid: false as const, error: "Gift card has no remaining balance" };
  }

  if (card.status === "EXPIRED" || (card.expiresAt && card.expiresAt < new Date())) {
    return { valid: false as const, error: "Gift card has expired" };
  }

  if (card.currentBalance <= 0) {
    return { valid: false as const, error: "Gift card has no remaining balance" };
  }

  return {
    valid: true as const,
    balance: card.currentBalance,
    code: card.code,
    id: card.id,
  };
}

// ==================== INTERNAL (used by checkout) ====================

/**
 * Redeem gift card balance atomically within a transaction.
 * Returns the amount actually deducted.
 */
export async function redeemGiftCardInTx(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  giftCardId: string,
  amount: number,
  orderId: string,
) {
  // Lock the row for update
  const [card] = await tx.select().from(giftCards).where(eq(giftCards.id, giftCardId));

  if (!card || card.status !== "ACTIVE" || card.currentBalance <= 0) {
    return 0;
  }

  const deduction = Math.min(amount, card.currentBalance);
  const newBalance = card.currentBalance - deduction;

  await tx
    .update(giftCards)
    .set({
      currentBalance: newBalance,
      status: newBalance === 0 ? "FULLY_REDEEMED" : "ACTIVE",
    })
    .where(eq(giftCards.id, giftCardId));

  await tx.insert(giftCardTransactions).values({
    giftCardId,
    type: "REDEMPTION",
    amount: -deduction,
    balanceAfter: newBalance,
    orderId,
    note: `Redeemed for order`,
    createdBy: "system",
  });

  return deduction;
}

/**
 * Refund back to a gift card within a transaction.
 */
export async function refundToGiftCardInTx(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  giftCardId: string,
  amount: number,
  orderId: string,
  note: string,
) {
  const [card] = await tx.select().from(giftCards).where(eq(giftCards.id, giftCardId));

  if (!card) throw new Error("Gift card not found");

  const newBalance = card.currentBalance + amount;

  await tx
    .update(giftCards)
    .set({
      currentBalance: newBalance,
      status: "ACTIVE",
    })
    .where(eq(giftCards.id, giftCardId));

  await tx.insert(giftCardTransactions).values({
    giftCardId,
    type: "REFUND",
    amount,
    balanceAfter: newBalance,
    orderId,
    note,
    createdBy: "system",
  });

  updateTag("gift-cards");
  updateTag("gift-card");
}
