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

// Cart types
export type CartItem = {
  productId: string;
  variantId: string | null;
  quantity: number;
  productName: string;
  variantName: string | null;
  unitPrice: number; // cents
  imageUrl: string | null;
};

// Checkout types
export type CheckoutResponse = {
  clientSecret: string;
  orderId: string;
};
