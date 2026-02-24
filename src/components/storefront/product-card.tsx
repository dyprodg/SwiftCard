import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DiscountBadge } from "@/components/storefront/discount-badge";
import { formatPrice } from "@/lib/utils/format-price";
import type { Product, ProductImage, ProductVariant } from "@/types";

export type ProductDiscount = {
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number; // basis points for %, cents for fixed
} | null;

type ProductCardProps = {
  product: Product & {
    images: ProductImage[];
    variants: ProductVariant[];
  };
  locale: string;
  discount?: ProductDiscount;
};

function applyDiscount(price: number, discount: ProductDiscount): number {
  if (!discount) return price;
  switch (discount.type) {
    case "PERCENTAGE":
      return Math.round(price - (price * discount.value) / 10000);
    case "FIXED":
      return Math.max(0, price - discount.value);
    case "FREE_SHIPPING":
      return price;
  }
}

export async function ProductCard({ product, locale, discount }: ProductCardProps) {
  const t = await getTranslations("common");
  const primaryImage = product.images[0];

  // Calculate price range from variants
  const prices =
    product.variants.length > 0
      ? product.variants.map((v) => product.basePrice + v.priceAdjustment)
      : [product.basePrice];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const hasMonetaryDiscount = discount && discount.type !== "FREE_SHIPPING";
  const discountedMin = applyDiscount(minPrice, discount ?? null);
  const discountedMax = applyDiscount(maxPrice, discount ?? null);

  return (
    <Link href={`/${locale}/products/${product.slug}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-square overflow-hidden">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt ?? product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="bg-muted flex h-full w-full items-center justify-center">
              <span className="text-muted-foreground">{t("noImage")}</span>
            </div>
          )}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {product.featured && <Badge>{t("featured")}</Badge>}
            {discount && <DiscountBadge type={discount.type} value={discount.value} />}
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="line-clamp-2 leading-tight font-medium">{product.name}</h3>
          {hasMonetaryDiscount ? (
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-primary text-sm font-semibold">
                {discountedMin === discountedMax
                  ? formatPrice(discountedMin)
                  : `${formatPrice(discountedMin)} – ${formatPrice(discountedMax)}`}
              </span>
              <span className="text-muted-foreground text-xs line-through">
                {minPrice === maxPrice
                  ? formatPrice(minPrice)
                  : `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`}
              </span>
            </div>
          ) : (
            <p className="text-primary mt-1 text-sm font-semibold">
              {minPrice === maxPrice
                ? formatPrice(minPrice)
                : `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`}
            </p>
          )}
          {product.variants.length > 0 && (
            <p className="text-muted-foreground mt-1 text-xs">
              {product.variants.length}{" "}
              {product.variants.length === 1 ? t("variant") : t("variants")}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
