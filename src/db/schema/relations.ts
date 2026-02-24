import { relations } from "drizzle-orm";
import {
  products,
  productImages,
  productVariants,
  categories,
  productTranslations,
} from "./products";
import { orders, orderItems, orderRefunds, orderRefundItems } from "./orders";
import { discounts, discountProducts, discountCategories } from "./discounts";
import { stockReservations } from "./reservations";
import { fulfillments, fulfillmentItems } from "./fulfillments";
import { orderEvents } from "./order-events";

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  variants: many(productVariants),
  orderItems: many(orderItems),
  translations: many(productTranslations),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  orderItems: many(orderItems),
  reservations: many(stockReservations),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryHierarchy",
  }),
  children: many(categories, { relationName: "categoryHierarchy" }),
  products: many(products),
}));

export const productTranslationsRelations = relations(productTranslations, ({ one }) => ({
  product: one(products, {
    fields: [productTranslations.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  items: many(orderItems),
  refunds: many(orderRefunds),
  fulfillments: many(fulfillments),
  reservations: many(stockReservations),
  events: many(orderEvents),
  discount: one(discounts, {
    fields: [orders.discountId],
    references: [discounts.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));

export const orderRefundsRelations = relations(orderRefunds, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderRefunds.orderId],
    references: [orders.id],
  }),
  items: many(orderRefundItems),
}));

export const orderRefundItemsRelations = relations(orderRefundItems, ({ one }) => ({
  refund: one(orderRefunds, {
    fields: [orderRefundItems.refundId],
    references: [orderRefunds.id],
  }),
  orderItem: one(orderItems, {
    fields: [orderRefundItems.orderItemId],
    references: [orderItems.id],
  }),
}));

// Discount relations
export const discountsRelations = relations(discounts, ({ many }) => ({
  products: many(discountProducts),
  categories: many(discountCategories),
  orders: many(orders),
}));

export const discountProductsRelations = relations(discountProducts, ({ one }) => ({
  discount: one(discounts, {
    fields: [discountProducts.discountId],
    references: [discounts.id],
  }),
  product: one(products, {
    fields: [discountProducts.productId],
    references: [products.id],
  }),
}));

export const discountCategoriesRelations = relations(discountCategories, ({ one }) => ({
  discount: one(discounts, {
    fields: [discountCategories.discountId],
    references: [discounts.id],
  }),
  category: one(categories, {
    fields: [discountCategories.categoryId],
    references: [categories.id],
  }),
}));

// Reservation relations
export const stockReservationsRelations = relations(stockReservations, ({ one }) => ({
  variant: one(productVariants, {
    fields: [stockReservations.variantId],
    references: [productVariants.id],
  }),
  order: one(orders, {
    fields: [stockReservations.orderId],
    references: [orders.id],
  }),
}));

// Fulfillment relations
export const fulfillmentsRelations = relations(fulfillments, ({ one, many }) => ({
  order: one(orders, {
    fields: [fulfillments.orderId],
    references: [orders.id],
  }),
  items: many(fulfillmentItems),
}));

export const fulfillmentItemsRelations = relations(fulfillmentItems, ({ one }) => ({
  fulfillment: one(fulfillments, {
    fields: [fulfillmentItems.fulfillmentId],
    references: [fulfillments.id],
  }),
  orderItem: one(orderItems, {
    fields: [fulfillmentItems.orderItemId],
    references: [orderItems.id],
  }),
}));

// Order event relations
export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, {
    fields: [orderEvents.orderId],
    references: [orders.id],
  }),
}));
