import {
  pgTable,
  pgEnum,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const giftCardStatusEnum = pgEnum("gift_card_status", [
  "ACTIVE",
  "DISABLED",
  "FULLY_REDEEMED",
  "EXPIRED",
]);

export const giftCardTransactionTypeEnum = pgEnum("gift_card_transaction_type", [
  "PURCHASE",
  "REDEMPTION",
  "REFUND",
  "ADJUSTMENT",
  "EXPIRATION",
]);

export const giftCards = pgTable(
  "gift_cards",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    code: text("code").notNull(),
    initialBalance: integer("initial_balance").notNull(), // cents
    currentBalance: integer("current_balance").notNull(), // cents
    currency: text("currency").default("CHF").notNull(),
    status: giftCardStatusEnum("status").default("ACTIVE").notNull(),
    recipientEmail: text("recipient_email"),
    recipientName: text("recipient_name"),
    senderName: text("sender_name"),
    personalMessage: text("personal_message"),
    purchasedByEmail: text("purchased_by_email"),
    purchasedByUserId: text("purchased_by_user_id"),
    sourceOrderId: text("source_order_id"), // order that created this card
    issuedByAdmin: text("issued_by_admin"), // admin userId (null for customer purchases)
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("gift_cards_code_idx").on(table.code),
    index("gift_cards_status_idx").on(table.status),
    index("gift_cards_recipient_email_idx").on(table.recipientEmail),
    index("gift_cards_source_order_idx").on(table.sourceOrderId),
  ],
);

export const giftCardTransactions = pgTable(
  "gift_card_transactions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    giftCardId: text("gift_card_id").notNull(),
    type: giftCardTransactionTypeEnum("type").notNull(),
    amount: integer("amount").notNull(), // positive = credit, negative = debit
    balanceAfter: integer("balance_after").notNull(),
    orderId: text("order_id"), // nullable for admin adjustments
    note: text("note"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("gift_card_txns_card_id_idx").on(table.giftCardId),
    index("gift_card_txns_order_id_idx").on(table.orderId),
  ],
);
