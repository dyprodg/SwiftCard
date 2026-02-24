import { pgTable, pgEnum, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const carrierEnum = pgEnum("carrier", ["POST", "DHL", "UPS", "OTHER"]);

export const fulfillments = pgTable(
  "fulfillments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    orderId: text("order_id").notNull(),
    trackingNumber: text("tracking_number"),
    carrier: carrierEnum("carrier"),
    carrierOther: text("carrier_other"),
    trackingUrl: text("tracking_url"),
    note: text("note"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("fulfillments_order_id_idx").on(table.orderId)],
);

export const fulfillmentItems = pgTable(
  "fulfillment_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    fulfillmentId: text("fulfillment_id").notNull(),
    orderItemId: text("order_item_id").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (table) => [index("fulfillment_items_fulfillment_id_idx").on(table.fulfillmentId)],
);
