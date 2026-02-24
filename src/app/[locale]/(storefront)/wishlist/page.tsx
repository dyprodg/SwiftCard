import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@clerk/nextjs/server";
import { Heart } from "lucide-react";

import { getWishlist } from "@/server/queries/wishlist";
import { localizeProduct } from "@/lib/utils/localize-product";
import { formatPrice } from "@/lib/utils/format-price";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WishlistButton } from "@/components/storefront/wishlist-button";

export default async function WishlistPage() {
  const { userId } = await auth();
  const locale = await getLocale();
  const t = await getTranslations("wishlist");

  if (!userId) {
    redirect(`/${locale}/sign-in`);
  }

  const items = await getWishlist(userId);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Heart className="text-muted-foreground mb-4 h-12 w-12" />
          <p className="text-muted-foreground mb-4 text-lg">{t("empty")}</p>
          <Button asChild>
            <Link href={`/${locale}/products`}>{t("browseProducts")}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map(({ product }) => {
            const localized = localizeProduct(product, locale);
            const image = localized.images[0];
            const prices =
              product.variants.length > 0
                ? product.variants.map((v) => product.basePrice + v.priceAdjustment)
                : [product.basePrice];
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);

            return (
              <Card key={product.id} className="group relative overflow-hidden">
                <div className="absolute top-2 right-2 z-10">
                  <WishlistButton
                    productId={product.id}
                    isWishlisted={true}
                    variant="overlay"
                  />
                </div>
                <Link href={`/${locale}/products/${product.slug}`}>
                  <div className="relative aspect-square overflow-hidden">
                    {image ? (
                      <Image
                        src={image.url}
                        alt={image.alt ?? localized.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="bg-muted flex h-full w-full items-center justify-center">
                        <span className="text-muted-foreground">{t("noImage")}</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="line-clamp-2 leading-tight font-medium">
                      {localized.name}
                    </h3>
                    <p className="text-primary mt-1 text-sm font-semibold">
                      {minPrice === maxPrice
                        ? formatPrice(minPrice)
                        : `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
