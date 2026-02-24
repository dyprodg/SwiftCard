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

export const reviewStatusEnum = pgEnum("review_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const wishlists = pgTable(
  "wishlists",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").notNull(),
    productId: text("product_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("wishlists_user_product_idx").on(table.userId, table.productId),
    index("wishlists_user_id_idx").on(table.userId),
  ],
);

export const productReviews = pgTable(
  "product_reviews",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    productId: text("product_id").notNull(),
    userId: text("user_id").notNull(),
    userEmail: text("user_email").notNull(),
    userName: text("user_name").notNull(),
    rating: integer("rating").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    verified: boolean("verified").default(false).notNull(),
    status: reviewStatusEnum("status").default("PENDING").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("product_reviews_user_product_idx").on(table.userId, table.productId),
    index("product_reviews_product_id_idx").on(table.productId),
    index("product_reviews_status_idx").on(table.status),
  ],
);

export const stockNotifications = pgTable(
  "stock_notifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    email: text("email").notNull(),
    variantId: text("variant_id").notNull(),
    productId: text("product_id").notNull(),
    notifiedAt: timestamp("notified_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("stock_notifications_email_variant_idx").on(table.email, table.variantId),
    index("stock_notifications_variant_id_idx").on(table.variantId),
    index("stock_notifications_product_id_idx").on(table.productId),
  ],
);
