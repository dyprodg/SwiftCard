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
import { wishlists, productReviews, stockNotifications } from "./customer-features";
import { customerAddresses } from "./customer-profiles";
import { shippingZones, shippingRates, taxZones } from "./shipping";
import { returns, returnItems } from "./returns";
import { bundles, bundleItems, bundleTranslations } from "./bundles";
import { giftCards, giftCardTransactions } from "./gift-cards";
import { newsletterSubscribers, emailCampaigns, campaignSends } from "./email-marketing";
import { subscriptionPlans, subscriptions } from "./subscriptions";
import { pages, pageTranslations } from "./pages";

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  variants: many(productVariants),
  orderItems: many(orderItems),
  translations: many(productTranslations),
  wishlists: many(wishlists),
  reviews: many(productReviews),
  stockNotifications: many(stockNotifications),
  subscriptionPlans: many(subscriptionPlans),
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
  stockNotifications: many(stockNotifications),
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
  returns: many(returns),
  subscription: one(subscriptions, {
    fields: [orders.subscriptionId],
    references: [subscriptions.id],
  }),
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

// Wishlist relations
export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  product: one(products, {
    fields: [wishlists.productId],
    references: [products.id],
  }),
}));

// Product review relations
export const productReviewsRelations = relations(productReviews, ({ one }) => ({
  product: one(products, {
    fields: [productReviews.productId],
    references: [products.id],
  }),
}));

// Stock notification relations
export const stockNotificationsRelations = relations(stockNotifications, ({ one }) => ({
  product: one(products, {
    fields: [stockNotifications.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [stockNotifications.variantId],
    references: [productVariants.id],
  }),
}));

// Customer address relations (no FK — userId is Clerk ID, not a DB column)
export const customerAddressesRelations = relations(customerAddresses, () => ({}));

// Shipping zone relations
export const shippingZonesRelations = relations(shippingZones, ({ many }) => ({
  rates: many(shippingRates),
}));

export const shippingRatesRelations = relations(shippingRates, ({ one }) => ({
  zone: one(shippingZones, {
    fields: [shippingRates.zoneId],
    references: [shippingZones.id],
  }),
}));

// Tax zone relations (no FKs)
export const taxZonesRelations = relations(taxZones, () => ({}));

// Return relations
export const returnsRelations = relations(returns, ({ one, many }) => ({
  order: one(orders, {
    fields: [returns.orderId],
    references: [orders.id],
  }),
  items: many(returnItems),
  refund: one(orderRefunds, {
    fields: [returns.refundId],
    references: [orderRefunds.id],
  }),
}));

export const returnItemsRelations = relations(returnItems, ({ one }) => ({
  return: one(returns, {
    fields: [returnItems.returnId],
    references: [returns.id],
  }),
  orderItem: one(orderItems, {
    fields: [returnItems.orderItemId],
    references: [orderItems.id],
  }),
}));

// Bundle relations
export const bundlesRelations = relations(bundles, ({ many }) => ({
  items: many(bundleItems),
  translations: many(bundleTranslations),
}));

export const bundleItemsRelations = relations(bundleItems, ({ one }) => ({
  bundle: one(bundles, {
    fields: [bundleItems.bundleId],
    references: [bundles.id],
  }),
  product: one(products, {
    fields: [bundleItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [bundleItems.variantId],
    references: [productVariants.id],
  }),
}));

export const bundleTranslationsRelations = relations(bundleTranslations, ({ one }) => ({
  bundle: one(bundles, {
    fields: [bundleTranslations.bundleId],
    references: [bundles.id],
  }),
}));

// Gift card relations
export const giftCardsRelations = relations(giftCards, ({ many }) => ({
  transactions: many(giftCardTransactions),
}));

export const giftCardTransactionsRelations = relations(
  giftCardTransactions,
  ({ one }) => ({
    giftCard: one(giftCards, {
      fields: [giftCardTransactions.giftCardId],
      references: [giftCards.id],
    }),
  }),
);

// Email marketing relations
export const emailCampaignsRelations = relations(emailCampaigns, ({ many }) => ({
  sends: many(campaignSends),
}));

export const campaignSendsRelations = relations(campaignSends, ({ one }) => ({
  campaign: one(emailCampaigns, {
    fields: [campaignSends.campaignId],
    references: [emailCampaigns.id],
  }),
  subscriber: one(newsletterSubscribers, {
    fields: [campaignSends.subscriberId],
    references: [newsletterSubscribers.id],
  }),
}));

export const newsletterSubscribersRelations = relations(
  newsletterSubscribers,
  ({ many }) => ({
    sends: many(campaignSends),
  }),
);

// Subscription relations
export const subscriptionPlansRelations = relations(
  subscriptionPlans,
  ({ one, many }) => ({
    product: one(products, {
      fields: [subscriptionPlans.productId],
      references: [products.id],
    }),
    variant: one(productVariants, {
      fields: [subscriptionPlans.variantId],
      references: [productVariants.id],
    }),
    subscriptions: many(subscriptions),
  }),
);

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id],
  }),
}));

// Page relations
export const pagesRelations = relations(pages, ({ many }) => ({
  translations: many(pageTranslations),
}));

export const pageTranslationsRelations = relations(pageTranslations, ({ one }) => ({
  page: one(pages, {
    fields: [pageTranslations.pageId],
    references: [pages.id],
  }),
}));
