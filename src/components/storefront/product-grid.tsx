import { ProductCard, type ProductDiscount } from "./product-card";
import type {
  Product,
  ProductImage,
  ProductVariant,
  DiscountWithRelations,
} from "@/types";

type ProductGridProps = {
  products: Array<
    Product & {
      images: ProductImage[];
      variants: ProductVariant[];
    }
  >;
  locale: string;
  discounts?: DiscountWithRelations[];
};

/**
 * Find the best applicable discount for a product.
 * "Best" = highest effective value. Everything-scoped discounts apply to all products.
 */
function findBestDiscount(
  product: Product,
  discounts: DiscountWithRelations[],
): ProductDiscount {
  let best: {
    type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
    value: number;
    score: number;
  } | null = null;

  for (const d of discounts) {
    const isScoped = d.products.length > 0 || d.categories.length > 0;

    if (isScoped) {
      const matchesProduct = d.products.some((p) => p.productId === product.id);
      const matchesCategory =
        product.categoryId &&
        d.categories.some((c) => c.categoryId === product.categoryId);
      if (!matchesProduct && !matchesCategory) continue;
    }

    // Score for comparison: percentage as effective on basePrice, fixed as cents, free_shipping as 0
    let score = 0;
    switch (d.type) {
      case "PERCENTAGE":
        score = Math.round((product.basePrice * d.value) / 10000);
        break;
      case "FIXED":
        score = Math.min(d.value, product.basePrice);
        break;
      case "FREE_SHIPPING":
        score = 0;
        break;
    }

    if (
      !best ||
      score > best.score ||
      (score === best.score &&
        d.type === "FREE_SHIPPING" &&
        best.type !== "FREE_SHIPPING")
    ) {
      best = { type: d.type, value: d.value, score };
    }
  }

  return best ? { type: best.type, value: best.value } : null;
}

export function ProductGrid({ products, locale, discounts }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground text-lg">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          locale={locale}
          discount={discounts ? findBestDiscount(product, discounts) : undefined}
        />
      ))}
    </div>
  );
}
