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
  "DISPUTE_OPENED",
  "DISPUTE_CLOSED",
  "DRAFT_CREATED",
  "DRAFT_UPDATED",
  "PAYMENT_LINK_SENT",
  "PAYMENT_LINK_EXPIRED",
  "RETURN_REQUESTED",
  "RETURN_APPROVED",
  "RETURN_RECEIVED",
  "RETURN_REFUNDED",
  "RETURN_REJECTED",
  "GIFT_CARD_APPLIED",
  "GIFT_CARD_ISSUED",
  "GIFT_CARD_REFUNDED",
  "SUBSCRIPTION_CREATED",
  "SUBSCRIPTION_RENEWED",
  "SUBSCRIPTION_CANCELLED",
  "SUBSCRIPTION_PAUSED",
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
