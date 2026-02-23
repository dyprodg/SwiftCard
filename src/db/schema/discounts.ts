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

export const discountTypeEnum = pgEnum("discount_type", [
  "PERCENTAGE",
  "FIXED",
  "FREE_SHIPPING",
]);

export const discounts = pgTable(
  "discounts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    code: text("code"), // nullable for automatic discounts
    name: text("name").notNull(),
    description: text("description"),
    type: discountTypeEnum("type").notNull(),
    value: integer("value").notNull(), // basis points for %, cents for fixed, 0 for free shipping
    minOrderAmount: integer("min_order_amount"), // cents
    maxUses: integer("max_uses"), // null = unlimited
    usedCount: integer("used_count").default(0).notNull(),
    maxUsesPerCustomer: integer("max_uses_per_customer"), // null = unlimited
    active: boolean("active").default(true).notNull(),
    automatic: boolean("automatic").default(false).notNull(),
    startsAt: timestamp("starts_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("discounts_code_idx").on(table.code),
    index("discounts_active_idx").on(table.active),
    index("discounts_automatic_idx").on(table.automatic),
    index("discounts_dates_idx").on(table.startsAt, table.expiresAt),
  ],
);

export const discountProducts = pgTable(
  "discount_products",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    discountId: text("discount_id").notNull(),
    productId: text("product_id").notNull(),
  },
  (table) => [
    index("discount_products_discount_id_idx").on(table.discountId),
    index("discount_products_product_id_idx").on(table.productId),
  ],
);

export const discountCategories = pgTable(
  "discount_categories",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    discountId: text("discount_id").notNull(),
    categoryId: text("category_id").notNull(),
  },
  (table) => [
    index("discount_categories_discount_id_idx").on(table.discountId),
    index("discount_categories_category_id_idx").on(table.categoryId),
  ],
);
