import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  products,
  productImages,
  productVariants,
  categories,
  productTranslations,
} from "@/db/schema/products";
import type { orders, orderItems } from "@/db/schema/orders";
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
