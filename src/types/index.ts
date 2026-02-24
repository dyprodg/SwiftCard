import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  products,
  productImages,
  productVariants,
  categories,
  productTranslations,
} from "@/db/schema/products";
import type {
  orders,
  orderItems,
  orderRefunds,
  orderRefundItems,
} from "@/db/schema/orders";
import type { shopSettings } from "@/db/schema/settings";
import type {
  discounts,
  discountProducts,
  discountCategories,
} from "@/db/schema/discounts";
import type { stockReservations } from "@/db/schema/reservations";
import type { fulfillments, fulfillmentItems } from "@/db/schema/fulfillments";
import type { orderEvents } from "@/db/schema/order-events";
import type {
  wishlists,
  productReviews,
  stockNotifications,
} from "@/db/schema/customer-features";
import type { customerAddresses, abandonedCarts } from "@/db/schema/customer-profiles";
import type { shippingZones, shippingRates, taxZones } from "@/db/schema/shipping";
import type { returns, returnItems } from "@/db/schema/returns";

// Product types
export type Product = InferSelectModel<typeof products>;
export type NewProduct = InferInsertModel<typeof products>;
export type ProductImage = InferSelectModel<typeof productImages>;
export type ProductVariant = InferSelectModel<typeof productVariants>;
export type Category = InferSelectModel<typeof categories>;
export type ProductTranslation = InferSelectModel<typeof productTranslations>;

// Order types
export type Order = InferSelectModel<typeof orders>;
export type NewOrder = InferInsertModel<typeof orders>;
export type OrderItem = InferSelectModel<typeof orderItems>;
export type OrderRefund = InferSelectModel<typeof orderRefunds>;
export type OrderRefundItem = InferSelectModel<typeof orderRefundItems>;

// Fulfillment types
export type Fulfillment = InferSelectModel<typeof fulfillments>;
export type FulfillmentItem = InferSelectModel<typeof fulfillmentItems>;

export type FulfillmentWithItems = Fulfillment & {
  items: FulfillmentItem[];
};

// Settings types
export type ShopSettings = InferSelectModel<typeof shopSettings>;

// Product with relations
export type ProductWithRelations = Product & {
  images: ProductImage[];
  variants: ProductVariant[];
  category: Category | null;
  translations: ProductTranslation[];
};

// Order with relations
export type OrderWithItems = Order & {
  items: OrderItem[];
};

export type OrderRefundWithItems = OrderRefund & {
  items: OrderRefundItem[];
};

export type OrderWithItemsAndRefunds = Order & {
  items: OrderItem[];
  refunds: OrderRefundWithItems[];
};

export type OrderWithItemsAndRefundsAndFulfillments = Order & {
  items: OrderItem[];
  refunds: OrderRefundWithItems[];
  fulfillments: FulfillmentWithItems[];
};

// Order event types
export type OrderEvent = InferSelectModel<typeof orderEvents>;

export type OrderWithAll = Order & {
  items: OrderItem[];
  refunds: OrderRefundWithItems[];
  fulfillments: FulfillmentWithItems[];
  events: OrderEvent[];
  returns: ReturnWithItems[];
};

// Return types
export type Return = InferSelectModel<typeof returns>;
export type ReturnItem = InferSelectModel<typeof returnItems>;

export type ReturnWithItems = Return & {
  items: ReturnItem[];
};

// Discount types
export type Discount = InferSelectModel<typeof discounts>;
export type DiscountProduct = InferSelectModel<typeof discountProducts>;
export type DiscountCategory = InferSelectModel<typeof discountCategories>;

export type DiscountWithRelations = Discount & {
  products: DiscountProduct[];
  categories: DiscountCategory[];
};

export type AppliedDiscount = {
  id: string;
  code: string | null;
  name: string;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;
  amount: number; // calculated discount amount in cents
  freeShipping: boolean;
  productIds: string[];
  categoryIds: string[];
};

// Reservation types
export type StockReservation = InferSelectModel<typeof stockReservations>;

// Customer feature types
export type Wishlist = InferSelectModel<typeof wishlists>;
export type ProductReview = InferSelectModel<typeof productReviews>;
export type StockNotification = InferSelectModel<typeof stockNotifications>;

export type ReviewRatingStats = {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>; // 1-5 -> count
};

// Customer profile types
export type CustomerAddress = InferSelectModel<typeof customerAddresses>;
export type NewCustomerAddress = InferInsertModel<typeof customerAddresses>;
export type AbandonedCart = InferSelectModel<typeof abandonedCarts>;

// Shipping & tax types
export type ShippingZone = InferSelectModel<typeof shippingZones>;
export type ShippingRate = InferSelectModel<typeof shippingRates>;
export type TaxZone = InferSelectModel<typeof taxZones>;

export type ShippingZoneWithRates = ShippingZone & {
  rates: ShippingRate[];
};

// Cart types
export type CartItem = {
  productId: string;
  variantId: string | null;
  quantity: number;
  productName: string;
  variantName: string | null;
  unitPrice: number; // cents
  imageUrl: string | null;
  categoryId: string | null;
};

// Checkout types
export type CheckoutResponse = {
  clientSecret: string;
  orderId: string;
};
