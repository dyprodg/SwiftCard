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

export const productStatusEnum = pgEnum("product_status", [
  "DRAFT",
  "ACTIVE",
  "ARCHIVED",
]);

export const products = pgTable(
  "products",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    basePrice: integer("base_price").notNull(),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    status: productStatusEnum("status").default("DRAFT").notNull(),
    featured: boolean("featured").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    publishedAt: timestamp("published_at"),
    categoryId: text("category_id"),
    subscribable: boolean("subscribable").default(false).notNull(),
  },
  (table) => [
    uniqueIndex("products_slug_idx").on(table.slug),
    index("products_status_idx").on(table.status),
    index("products_category_id_idx").on(table.categoryId),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    url: text("url").notNull(),
    alt: text("alt"),
    position: integer("position").default(0).notNull(),
    productId: text("product_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("product_images_product_id_idx").on(table.productId)],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    sku: text("sku").notNull(),
    size: text("size"),
    color: text("color"),
    material: text("material"),
    priceAdjustment: integer("price_adjustment").default(0).notNull(),
    weight: integer("weight"), // grams, nullable (null = weightless)
    stock: integer("stock").default(0).notNull(),
    isAvailable: boolean("is_available").default(true).notNull(),
    productId: text("product_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("product_variants_sku_idx").on(table.sku),
    index("product_variants_product_id_idx").on(table.productId),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    parentId: text("parent_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("categories_slug_idx").on(table.slug),
    index("categories_parent_id_idx").on(table.parentId),
  ],
);

export const productTranslations = pgTable(
  "product_translations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    productId: text("product_id").notNull(),
  },
  (table) => [
    uniqueIndex("product_translations_product_locale_idx").on(
      table.productId,
      table.locale,
    ),
    index("product_translations_locale_idx").on(table.locale),
  ],
);
