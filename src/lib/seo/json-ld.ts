export function organizationJsonLd(shopName: string, appUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: shopName,
    url: appUrl,
  };
}

export function productJsonLd(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product: Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variants: Record<string, any>[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  images: Record<string, any>[],
  appUrl: string,
  locale: string,
) {
  const prices =
    variants.length > 0
      ? variants.map((v) => product.basePrice + v.priceAdjustment)
      : [product.basePrice];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const totalStock =
    variants.length > 0 ? variants.reduce((sum, v) => sum + v.stock, 0) : undefined;
  const availability =
    totalStock !== undefined
      ? totalStock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock"
      : "https://schema.org/InStock";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    url: `${appUrl}/${locale}/products/${product.slug}`,
    image: images.map((img) => img.url),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "CHF",
      lowPrice: (minPrice / 100).toFixed(2),
      highPrice: (maxPrice / 100).toFixed(2),
      offerCount: Math.max(variants.length, 1),
      availability,
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
