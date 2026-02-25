import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils/format-price";
import { calculateBundleSavings } from "@/lib/utils/bundle-calculator";
import type { BundleWithItems } from "@/types";

type BundleCardProps = {
  bundle: BundleWithItems;
  locale: string;
};

export function BundleCard({ bundle, locale }: BundleCardProps) {
  const itemPrices = bundle.items.map((item) => ({
    unitPrice: item.product.basePrice + (item.variant?.priceAdjustment ?? 0),
    quantity: item.quantity,
  }));
  const { totalValue, savings, savingsPercent } = calculateBundleSavings(
    bundle.bundlePrice,
    itemPrices,
  );

  // Use first product's first image
  const primaryImage = bundle.items[0]?.product?.images?.[0];

  return (
    <Link href={`/${locale}/bundles/${bundle.slug}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-square overflow-hidden">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt ?? bundle.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="bg-muted flex h-full w-full items-center justify-center">
              <span className="text-muted-foreground text-sm">
                {bundle.items.length} items
              </span>
            </div>
          )}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {savings > 0 && (
              <Badge variant="secondary">
                {locale === "de" ? "Spare" : "Save"} {savingsPercent}%
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="line-clamp-2 leading-tight font-medium">{bundle.name}</h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-primary text-sm font-semibold">
              {formatPrice(bundle.bundlePrice)}
            </span>
            {savings > 0 && (
              <span className="text-muted-foreground text-xs line-through">
                {formatPrice(totalValue)}
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {bundle.items.length} {locale === "de" ? "Artikel" : "items"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
