import {
  pgTable,
  pgEnum,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
]);

export const fulfillmentStatusEnum = pgEnum("fulfillment_status", [
  "UNFULFILLED",
  "PARTIALLY_FULFILLED",
  "FULFILLED",
  "RETURNED",
]);

export const orders = pgTable(
  "orders",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    orderNumber: text("order_number").notNull(),
    status: orderStatusEnum("status").default("PENDING").notNull(),
    paymentStatus: paymentStatusEnum("payment_status").default("PENDING").notNull(),
    fulfillmentStatus: fulfillmentStatusEnum("fulfillment_status")
      .default("UNFULFILLED")
      .notNull(),
    subtotal: integer("subtotal").notNull(),
    tax: integer("tax").notNull(),
    shipping: integer("shipping").notNull(),
    total: integer("total").notNull(),
    currency: text("currency").default("CHF").notNull(),
    customerId: text("customer_id"),
    customerEmail: text("customer_email").notNull(),
    shippingName: text("shipping_name").notNull(),
    shippingAddress1: text("shipping_address1").notNull(),
    shippingAddress2: text("shipping_address2"),
    shippingCity: text("shipping_city").notNull(),
    shippingZip: text("shipping_zip").notNull(),
    shippingCountry: text("shipping_country").notNull(),
    billingName: text("billing_name"),
    billingAddress1: text("billing_address1"),
    billingAddress2: text("billing_address2"),
    billingCity: text("billing_city"),
    billingZip: text("billing_zip"),
    billingCountry: text("billing_country"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    customerNote: text("customer_note"),
    internalNote: text("internal_note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    paidAt: timestamp("paid_at"),
    shippedAt: timestamp("shipped_at"),
    deliveredAt: timestamp("delivered_at"),
    cancelledAt: timestamp("cancelled_at"),
    guestAccessToken: text("guest_access_token")
      .$defaultFn(() => createId())
      .notNull(),
  },
  (table) => [
    uniqueIndex("orders_order_number_idx").on(table.orderNumber),
    uniqueIndex("orders_stripe_pi_idx").on(table.stripePaymentIntentId),
    uniqueIndex("orders_guest_token_idx").on(table.guestAccessToken),
    index("orders_customer_id_idx").on(table.customerId),
    index("orders_status_idx").on(table.status),
    index("orders_created_at_idx").on(table.createdAt),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    orderId: text("order_id").notNull(),
    productId: text("product_id").notNull(),
    variantId: text("variant_id"),
    productName: text("product_name").notNull(),
    variantName: text("variant_name"),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(),
    total: integer("total").notNull(),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    index("order_items_product_id_idx").on(table.productId),
  ],
);
