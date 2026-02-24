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
