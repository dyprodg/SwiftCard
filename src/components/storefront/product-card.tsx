import Image from "next/image";
import Link from "next/link";
import { getLocale } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils/format-price";
import type { Product, ProductImage, ProductVariant } from "@/types";

type ProductCardProps = {
  product: Product & {
    images: ProductImage[];
    variants: ProductVariant[];
  };
};

export async function ProductCard({ product }: ProductCardProps) {
  const locale = await getLocale();
  const primaryImage = product.images[0];

  // Calculate price range from variants
  const prices =
    product.variants.length > 0
      ? product.variants.map((v) => product.basePrice + v.priceAdjustment)
      : [product.basePrice];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

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
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
          {product.featured && <Badge className="absolute top-2 left-2">Featured</Badge>}
        </div>
        <CardContent className="p-4">
          <h3 className="line-clamp-2 leading-tight font-medium">{product.name}</h3>
          <p className="text-primary mt-1 text-sm font-semibold">
            {minPrice === maxPrice
              ? formatPrice(minPrice)
              : `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`}
          </p>
          {product.variants.length > 0 && (
            <p className="text-muted-foreground mt-1 text-xs">
              {product.variants.length} variant
              {product.variants.length !== 1 ? "s" : ""}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
