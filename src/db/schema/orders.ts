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

export const orderStatusEnum = pgEnum("order_status", [
  "DRAFT",
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
  "PARTIALLY_REFUNDED",
]);

export const refundReasonEnum = pgEnum("refund_reason", [
  "DAMAGED",
  "MISSING_ITEM",
  "CUSTOMER_REQUEST",
  "DUPLICATE",
  "OTHER",
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
    phone: text("phone"),
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
    shippingMethod: text("shipping_method"),
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
    discountId: text("discount_id"),
    discountAmount: integer("discount_amount").default(0).notNull(),
    discountCode: text("discount_code"), // snapshot for history
    totalRefunded: integer("total_refunded").default(0).notNull(),
    guestAccessToken: text("guest_access_token")
      .$defaultFn(() => createId())
      .notNull(),
    isDraft: boolean("is_draft").default(false).notNull(),
    createdByAdmin: text("created_by_admin"),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    paymentLinkUrl: text("payment_link_url"),
    paymentLinkExpiresAt: timestamp("payment_link_expires_at"),
    paymentLinkSentAt: timestamp("payment_link_sent_at"),
    taxInclusive: boolean("tax_inclusive").default(true).notNull(),
    giftCardId: text("gift_card_id"),
    giftCardAmount: integer("gift_card_amount").default(0).notNull(),
    giftCardCode: text("gift_card_code"),
    subscriptionId: text("subscription_id"),
  },
  (table) => [
    uniqueIndex("orders_order_number_idx").on(table.orderNumber),
    uniqueIndex("orders_stripe_pi_idx").on(table.stripePaymentIntentId),
    uniqueIndex("orders_guest_token_idx").on(table.guestAccessToken),
    uniqueIndex("orders_stripe_session_idx").on(table.stripeCheckoutSessionId),
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
    bundleId: text("bundle_id"), // nullable — links to bundle purchase
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    index("order_items_product_id_idx").on(table.productId),
  ],
);

export const orderRefunds = pgTable(
  "order_refunds",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    orderId: text("order_id").notNull(),
    stripeRefundId: text("stripe_refund_id").notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency").default("CHF").notNull(),
    reason: refundReasonEnum("reason").notNull(),
    note: text("note"),
    isFullRefund: boolean("is_full_refund").default(false).notNull(),
    stockRestored: boolean("stock_restored").default(false).notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("order_refunds_stripe_id_idx").on(table.stripeRefundId),
    index("order_refunds_order_id_idx").on(table.orderId),
  ],
);

export const orderRefundItems = pgTable(
  "order_refund_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    refundId: text("refund_id").notNull(),
    orderItemId: text("order_item_id").notNull(),
    quantity: integer("quantity").notNull(),
    amount: integer("amount").notNull(),
  },
  (table) => [index("order_refund_items_refund_id_idx").on(table.refundId)],
);
