import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";

import { getProductBySlug } from "@/server/queries/products";
import { getActiveDiscountsForDisplay } from "@/server/queries/discounts";
import { localizeProduct } from "@/lib/utils/localize-product";
import { productJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { formatPrice } from "@/lib/utils/format-price";
import { Badge } from "@/components/ui/badge";
import { DiscountBadge } from "@/components/storefront/discount-badge";
import { ProductDetailClient } from "./product-detail-client";
import type { DiscountWithRelations } from "@/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const product = await getProductBySlug(slug);

  if (!product || product.status !== "ACTIVE") return {};

  const localized = localizeProduct(product, locale);
  const title = product.metaTitle || localized.name;
  const description = product.metaDescription || localized.description || undefined;
  const url = `${APP_URL}/${locale}/products/${slug}`;
  const image = product.images[0]?.url;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        de: `${APP_URL}/de/products/${slug}`,
        en: `${APP_URL}/en/products/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      locale,
      type: "website",
      ...(image && { images: [{ url: image, alt: localized.name }] }),
    },
  };
}

function findBestDiscountForProduct(
  product: { id: string; categoryId: string | null; basePrice: number },
  discounts: DiscountWithRelations[],
): DiscountWithRelations | null {
  let best: { discount: DiscountWithRelations; score: number } | null = null;

  for (const d of discounts) {
    const isScoped = d.products.length > 0 || d.categories.length > 0;
    if (isScoped) {
      const matchesProduct = d.products.some((p) => p.productId === product.id);
      const matchesCategory =
        product.categoryId && d.categories.some((c) => c.categoryId === product.categoryId);
      if (!matchesProduct && !matchesCategory) continue;
    }

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

    if (!best || score > best.score) {
      best = { discount: d, score };
    }
  }

  return best?.discount ?? null;
}

function applyDiscountToPrice(price: number, discount: DiscountWithRelations): number {
  switch (discount.type) {
    case "PERCENTAGE":
      return Math.round(price - (price * discount.value) / 10000);
    case "FIXED":
      return Math.max(0, price - discount.value);
    case "FREE_SHIPPING":
      return price;
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("products");
  const tc = await getTranslations("common");
  const [product, activeDiscounts] = await Promise.all([
    getProductBySlug(slug),
    getActiveDiscountsForDisplay(),
  ]);

  if (!product || product.status !== "ACTIVE") {
    notFound();
  }

  const localized = localizeProduct(product, locale);
  const primaryImage = localized.images[0];
  const discount = findBestDiscountForProduct(product, activeDiscounts);

  const breadcrumbItems = [
    { name: tc("home"), url: `${APP_URL}/${locale}` },
    { name: t("title"), url: `${APP_URL}/${locale}/products` },
    ...(product.category
      ? [
          {
            name: product.category.name,
            url: `${APP_URL}/${locale}/products?category=${product.category.slug}`,
          },
        ]
      : []),
    { name: localized.name, url: `${APP_URL}/${locale}/products/${product.slug}` },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            productJsonLd(localized, product.variants, product.images, APP_URL, locale),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(breadcrumbItems)),
        }}
      />
      {/* Breadcrumb */}
      <nav className="text-muted-foreground mb-6 flex items-center gap-1 text-sm">
        <Link href={`/${locale}`} className="hover:text-foreground transition-colors">
          {tc("home")}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href={`/${locale}/products`}
          className="hover:text-foreground transition-colors"
        >
          {t("title")}
        </Link>
        {product.category && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span>{product.category.name}</span>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{localized.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg border">
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={primaryImage.alt ?? localized.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="bg-muted flex h-full w-full items-center justify-center">
                <span className="text-muted-foreground">{tc("noImage")}</span>
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <div
                  key={img.id}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border"
                >
                  <Image
                    src={img.url}
                    alt={img.alt ?? `${localized.name} ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex flex-wrap gap-1">
              {product.featured && <Badge>{tc("featured")}</Badge>}
              {discount && <DiscountBadge type={discount.type} value={discount.value} />}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{localized.name}</h1>
            {product.category && (
              <p className="text-muted-foreground mt-1 text-sm">
                {product.category.name}
              </p>
            )}
          </div>

          {/* Price (shown when no variants) */}
          {product.variants.length === 0 && (
            discount && discount.type !== "FREE_SHIPPING" ? (
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold">
                  {formatPrice(applyDiscountToPrice(product.basePrice, discount))}
                </span>
                <span className="text-muted-foreground text-lg line-through">
                  {formatPrice(product.basePrice)}
                </span>
              </div>
            ) : (
              <p className="text-2xl font-bold">{formatPrice(product.basePrice)}</p>
            )
          )}

          {/* Variant Selector + Add to Cart */}
          <ProductDetailClient
            productId={product.id}
            productName={localized.name}
            variants={product.variants}
            basePrice={product.basePrice}
            imageUrl={product.images[0]?.url ?? null}
          />

          {/* Description */}
          {localized.description && (
            <div>
              <h2 className="mb-2 text-lg font-semibold">{t("description")}</h2>
              <p className="text-muted-foreground whitespace-pre-line">
                {localized.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
