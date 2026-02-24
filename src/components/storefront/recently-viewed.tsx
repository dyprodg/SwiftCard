"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

import { useRecentlyViewedStore } from "@/stores/recently-viewed-store";
import { getProductsByIds } from "@/server/queries/recently-viewed";
import { formatPrice } from "@/lib/utils/format-price";
import { Card, CardContent } from "@/components/ui/card";

type RecentProduct = {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  images: { url: string; alt: string | null }[];
};

type RecentlyViewedProps = {
  locale: string;
  excludeProductId?: string;
};

export function RecentlyViewed({ locale, excludeProductId }: RecentlyViewedProps) {
  const t = useTranslations("recentlyViewed");
  const productIds = useRecentlyViewedStore((s) => s.productIds);
  const [products, setProducts] = useState<RecentProduct[]>([]);

  const filteredIds = excludeProductId
    ? productIds.filter((id) => id !== excludeProductId)
    : productIds;

  const fetchProducts = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return [];
    return getProductsByIds(ids.slice(0, 6));
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchProducts(filteredIds).then((items) => {
      if (!cancelled) setProducts(items as RecentProduct[]);
    });
    return () => {
      cancelled = true;
    };
  }, [filteredIds, fetchProducts]);

  if (products.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">{t("title")}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {products.map((product) => (
          <Link key={product.id} href={`/${locale}/products/${product.slug}`}>
            <Card className="group overflow-hidden transition-shadow hover:shadow-md">
              <div className="relative aspect-square overflow-hidden">
                {product.images[0] ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.images[0].alt ?? product.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  />
                ) : (
                  <div className="bg-muted flex h-full w-full items-center justify-center">
                    <span className="text-muted-foreground text-xs">{t("noImage")}</span>
                  </div>
                )}
              </div>
              <CardContent className="p-2">
                <p className="line-clamp-1 text-sm font-medium">{product.name}</p>
                <p className="text-primary text-xs font-semibold">
                  {formatPrice(product.basePrice)}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
