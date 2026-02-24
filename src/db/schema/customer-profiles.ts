import {
  pgTable,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const customerAddresses = pgTable(
  "customer_addresses",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").notNull(),
    label: text("label").notNull(), // "Home", "Work", etc.
    name: text("name").notNull(),
    phone: text("phone"),
    company: text("company"),
    address1: text("address1").notNull(),
    address2: text("address2"),
    city: text("city").notNull(),
    zip: text("zip").notNull(),
    country: text("country").notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("customer_addresses_user_id_idx").on(table.userId),
    index("customer_addresses_default_idx").on(table.userId, table.isDefault),
  ],
);

export const abandonedCarts = pgTable(
  "abandoned_carts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    sessionId: text("session_id").notNull(),
    userId: text("user_id"),
    email: text("email"),
    items: jsonb("items").notNull(), // CartItem[] snapshot
    subtotal: integer("subtotal").notNull(), // cents
    recoveryToken: text("recovery_token")
      .notNull()
      .$defaultFn(() => createId()),
    emailSentAt: timestamp("email_sent_at"),
    recoveredAt: timestamp("recovered_at"),
    abandonedAt: timestamp("abandoned_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("abandoned_carts_recovery_token_idx").on(table.recoveryToken),
    index("abandoned_carts_session_id_idx").on(table.sessionId),
    index("abandoned_carts_email_idx").on(table.email),
    index("abandoned_carts_abandoned_at_idx").on(table.abandonedAt),
    index("abandoned_carts_email_sent_at_idx").on(table.emailSentAt),
  ],
);
