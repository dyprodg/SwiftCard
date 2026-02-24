import { pgTable, pgEnum, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const returnStatusEnum = pgEnum("return_status", [
  "REQUESTED",
  "APPROVED",
  "RECEIVED",
  "REFUNDED",
  "REJECTED",
]);

export const returnReasonEnum = pgEnum("return_reason", [
  "DEFECTIVE",
  "WRONG_ITEM",
  "NOT_AS_DESCRIBED",
  "CHANGED_MIND",
  "TOO_LARGE",
  "TOO_SMALL",
  "OTHER",
]);

export const returns = pgTable(
  "returns",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    orderId: text("order_id").notNull(),
    customerId: text("customer_id").notNull(),
    customerEmail: text("customer_email").notNull(),
    status: returnStatusEnum("status").default("REQUESTED").notNull(),
    reason: returnReasonEnum("reason").notNull(),
    note: text("note"),
    adminNote: text("admin_note"),
    refundId: text("refund_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    approvedAt: timestamp("approved_at"),
    receivedAt: timestamp("received_at"),
    refundedAt: timestamp("refunded_at"),
    rejectedAt: timestamp("rejected_at"),
  },
  (table) => [
    index("returns_order_id_idx").on(table.orderId),
    index("returns_customer_id_idx").on(table.customerId),
    index("returns_status_idx").on(table.status),
    index("returns_created_at_idx").on(table.createdAt),
  ],
);

export const returnItems = pgTable(
  "return_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    returnId: text("return_id").notNull(),
    orderItemId: text("order_item_id").notNull(),
    quantity: integer("quantity").notNull(),
    reason: returnReasonEnum("reason"),
  },
  (table) => [index("return_items_return_id_idx").on(table.returnId)],
);
