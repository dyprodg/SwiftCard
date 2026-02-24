import {
  pgTable,
  pgEnum,
  text,
  integer,
  boolean,
  real,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const shippingRateTypeEnum = pgEnum("shipping_rate_type", [
  "FLAT",
  "WEIGHT_BASED",
  "PRICE_BASED",
]);

export const shippingZones = pgTable("shipping_zones", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  countries: text("countries").array().notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const shippingRates = pgTable(
  "shipping_rates",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    zoneId: text("zone_id").notNull(),
    name: text("name").notNull(),
    type: shippingRateTypeEnum("type").notNull(),
    minValue: integer("min_value"), // grams (weight) or cents (price)
    maxValue: integer("max_value"), // grams (weight) or cents (price)
    price: integer("price").notNull(), // in cents
    freeAbove: integer("free_above"), // free if subtotal >= this (cents)
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("shipping_rates_zone_id_idx").on(table.zoneId)],
);

export const taxZones = pgTable("tax_zones", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  countries: text("countries").array().notNull(),
  taxRate: real("tax_rate").notNull(), // e.g. 0.081 for 8.1%
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
