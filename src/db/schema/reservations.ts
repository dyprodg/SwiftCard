import { pgTable, pgEnum, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const reservationStatusEnum = pgEnum("reservation_status", [
  "RESERVED",
  "CONVERTED",
  "EXPIRED",
]);

export const stockReservations = pgTable(
  "stock_reservations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    variantId: text("variant_id").notNull(),
    quantity: integer("quantity").notNull(),
    sessionId: text("session_id").notNull(),
    orderId: text("order_id"),
    status: reservationStatusEnum("status").default("RESERVED").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    convertedAt: timestamp("converted_at"),
    expiredAt: timestamp("expired_at"),
  },
  (table) => [
    index("stock_reservations_variant_id_idx").on(table.variantId),
    index("stock_reservations_session_id_idx").on(table.sessionId),
    index("stock_reservations_order_id_idx").on(table.orderId),
    index("stock_reservations_status_idx").on(table.status),
    index("stock_reservations_expires_at_idx").on(table.expiresAt),
  ],
);
