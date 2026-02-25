import {
  pgTable,
  pgEnum,
  text,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const bundleStatusEnum = pgEnum("bundle_status", ["DRAFT", "ACTIVE", "ARCHIVED"]);

export const bundles = pgTable(
  "bundles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    bundlePrice: integer("bundle_price").notNull(), // cents — the discounted price
    status: bundleStatusEnum("status").default("DRAFT").notNull(),
    featured: boolean("featured").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("bundles_slug_idx").on(table.slug),
    index("bundles_status_idx").on(table.status),
  ],
);

export const bundleItems = pgTable(
  "bundle_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    bundleId: text("bundle_id").notNull(),
    productId: text("product_id").notNull(),
    variantId: text("variant_id"), // nullable — if null, customer picks variant
    quantity: integer("quantity").default(1).notNull(),
    position: integer("position").default(0).notNull(),
  },
  (table) => [
    index("bundle_items_bundle_id_idx").on(table.bundleId),
    index("bundle_items_product_id_idx").on(table.productId),
  ],
);

export const bundleTranslations = pgTable(
  "bundle_translations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    bundleId: text("bundle_id").notNull(),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    description: text("description"),
  },
  (table) => [
    uniqueIndex("bundle_translations_bundle_locale_idx").on(table.bundleId, table.locale),
  ],
);
