import { pgTable, pgEnum, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const orderEventTypeEnum = pgEnum("order_event_type", [
  "ORDER_CREATED",
  "STATUS_CHANGED",
  "PAYMENT_STATUS_CHANGED",
  "FULFILLMENT_CREATED",
  "FULFILLMENT_STATUS_CHANGED",
  "REFUND_CREATED",
  "SHIPPING_ADDRESS_EDITED",
  "CUSTOMER_NOTE_EDITED",
  "INTERNAL_NOTE_ADDED",
]);

export const orderEvents = pgTable(
  "order_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    orderId: text("order_id").notNull(),
    type: orderEventTypeEnum("type").notNull(),
    data: jsonb("data"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("order_events_order_id_idx").on(table.orderId),
    index("order_events_created_at_idx").on(table.createdAt),
  ],
);
