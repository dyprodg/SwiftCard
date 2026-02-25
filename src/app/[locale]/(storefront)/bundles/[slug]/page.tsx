import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

import { getBundleBySlug } from "@/server/queries/bundles";
import { formatPrice } from "@/lib/utils/format-price";
import { calculateBundleSavings } from "@/lib/utils/bundle-calculator";
import { Badge } from "@/components/ui/badge";
import { AddBundleToCartButton } from "./add-bundle-button";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function BundleDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const t = await getTranslations("bundles");
  const bundle = await getBundleBySlug(slug);

  if (!bundle) notFound();

  const translation = bundle.translations.find((t) => t.locale === locale);
  const displayName = translation?.name ?? bundle.name;
  const displayDescription = translation?.description ?? bundle.description;

  const itemPrices = bundle.items.map((item) => ({
    unitPrice: item.product.basePrice + (item.variant?.priceAdjustment ?? 0),
    quantity: item.quantity,
  }));
  const { totalValue, savings, savingsPercent } = calculateBundleSavings(
    bundle.bundlePrice,
    itemPrices,
  );

  // Check if all items have pre-set variants (or have no variants)
  const needsVariantSelection = bundle.items.some(
    (item) => !item.variantId && item.product.variants.length > 0,
  );

  // Check stock
  const allInStock = bundle.items.every((item) => {
    if (item.variant) return item.variant.stock >= item.quantity;
    if (item.product.variants.length === 0) return true;
    return item.product.variants.some((v) => v.stock >= item.quantity);
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Images grid */}
        <div className="grid grid-cols-2 gap-4">
          {bundle.items.map((item) => {
            const img = item.product.images?.[0];
            return (
              <div
                key={item.id}
                className="relative aspect-square overflow-hidden rounded-lg"
              >
                {img ? (
                  <Image
                    src={img.url}
                    alt={img.alt ?? item.product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="bg-muted flex h-full w-full items-center justify-center">
                    <span className="text-muted-foreground text-sm">
                      {item.product.name}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{displayName}</h1>
            {displayDescription && (
              <p className="text-muted-foreground mt-2">{displayDescription}</p>
            )}
          </div>

          {/* Pricing */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-primary text-3xl font-bold">
                {formatPrice(bundle.bundlePrice)}
              </span>
              {savings > 0 && (
                <span className="text-muted-foreground text-lg line-through">
                  {formatPrice(totalValue)}
                </span>
              )}
            </div>
            {savings > 0 && (
              <Badge variant="secondary" className="text-sm">
                {t("save", { amount: formatPrice(savings) })} ({savingsPercent}%)
              </Badge>
            )}
          </div>

          {/* Included items */}
          <div>
            <h2 className="mb-3 font-semibold">{t("includes")}</h2>
            <div className="space-y-3">
              {bundle.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-md border p-3"
                >
                  {item.product.images?.[0] && (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded">
                      <Image
                        src={item.product.images[0].url}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.product.name}</p>
                    {item.variant && (
                      <p className="text-muted-foreground text-xs">
                        {[item.variant.size, item.variant.color, item.variant.material]
                          .filter(Boolean)
                          .join(" / ")}
                      </p>
                    )}
                  </div>
                  {item.quantity > 1 && (
                    <span className="text-muted-foreground text-sm">
                      x{item.quantity}
                    </span>
                  )}
                  <span className="text-muted-foreground text-sm">
                    {formatPrice(
                      (item.product.basePrice + (item.variant?.priceAdjustment ?? 0)) *
                        item.quantity,
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stock */}
          <p className={`text-sm ${allInStock ? "text-green-600" : "text-destructive"}`}>
            {allInStock ? t("allInStock") : t("someOutOfStock")}
          </p>

          {/* Add to Cart */}
          <AddBundleToCartButton
            bundleId={bundle.id}
            bundleItems={bundle.items.map((item) => ({
              id: item.id,
              productId: item.productId,
              variantId: item.variantId,
              productName: item.product.name,
              variants: item.product.variants.map((v) => ({
                id: v.id,
                name: [v.size, v.color, v.material].filter(Boolean).join(" / "),
                stock: v.stock,
              })),
            }))}
            needsVariantSelection={needsVariantSelection}
            disabled={!allInStock}
          />
        </div>
      </div>
    </div>
  );
}
