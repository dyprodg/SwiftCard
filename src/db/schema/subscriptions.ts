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

export const subscriptionIntervalEnum = pgEnum("subscription_interval", [
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "ACTIVE",
  "PAUSED",
  "PAST_DUE",
  "CANCELLED",
  "EXPIRED",
]);

export const subscriptionPlans = pgTable(
  "subscription_plans",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    productId: text("product_id").notNull(),
    variantId: text("variant_id"),
    name: text("name").notNull(),
    interval: subscriptionIntervalEnum("interval").notNull(),
    discountPercent: integer("discount_percent").default(0).notNull(), // basis points 0-10000
    stripePriceId: text("stripe_price_id").notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("subscription_plans_product_id_idx").on(table.productId),
    index("subscription_plans_variant_id_idx").on(table.variantId),
    uniqueIndex("subscription_plans_stripe_price_id_idx").on(table.stripePriceId),
  ],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    planId: text("plan_id").notNull(),
    customerId: text("customer_id").notNull(), // Clerk userId
    customerEmail: text("customer_email").notNull(),
    stripeSubscriptionId: text("stripe_subscription_id").notNull(),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    status: subscriptionStatusEnum("status").default("ACTIVE").notNull(),
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelledAt: timestamp("cancelled_at"),
    pausedAt: timestamp("paused_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("subscriptions_customer_id_idx").on(table.customerId),
    index("subscriptions_plan_id_idx").on(table.planId),
    uniqueIndex("subscriptions_stripe_sub_id_idx").on(table.stripeSubscriptionId),
    index("subscriptions_status_idx").on(table.status),
  ],
);
