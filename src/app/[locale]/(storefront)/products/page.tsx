import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";

import { getActiveProducts } from "@/server/queries/products";
import { localizeProducts } from "@/lib/utils/localize-product";
import { getCategories } from "@/server/queries/categories";
import { ProductGrid } from "@/components/storefront/product-grid";
import { ProductGridSkeleton } from "@/components/storefront/product-grid-skeleton";
import { Button } from "@/components/ui/button";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("products");
  const url = `${APP_URL}/${locale}/products`;

  return {
    title: t("title"),
    alternates: {
      canonical: url,
      languages: { de: `${APP_URL}/de/products`, en: `${APP_URL}/en/products` },
    },
    openGraph: {
      title: t("title"),
      url,
      locale,
      type: "website",
    },
  };
}

type Props = {
  searchParams: Promise<{
    page?: string;
    category?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: Props) {
  const locale = await getLocale();
  const t = await getTranslations("products");
  const sp = await searchParams;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      </div>

      <Suspense fallback={<ProductGridSkeleton count={12} />}>
        <ProductsContent
          locale={locale}
          page={parseInt(sp.page ?? "1")}
          category={sp.category}
        />
      </Suspense>
    </div>
  );
}

async function ProductsContent({
  locale,
  page,
  category,
}: {
  locale: string;
  page: number;
  category?: string;
}) {
  const t = await getTranslations("products");
  const pageSize = 12;

  const [{ items, total }, categories] = await Promise.all([
    getActiveProducts(pageSize, (page - 1) * pageSize),
    getCategories(),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <p className="text-muted-foreground -mt-6 mb-8">
        {total} {t("productsFound")}
      </p>

      <div className="flex gap-8">
        {/* Category Sidebar */}
        {categories.length > 0 && (
          <aside className="hidden w-48 shrink-0 lg:block">
            <h3 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
              {t("categories")}
            </h3>
            <nav className="space-y-1">
              <Link
                href={`/${locale}/products`}
                className="text-muted-foreground hover:bg-muted hover:text-foreground block rounded-md px-3 py-1.5 text-sm"
              >
                {t("allProducts")}
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/${locale}/products?category=${cat.slug}`}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground block rounded-md px-3 py-1.5 text-sm"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          </aside>
        )}

        {/* Products */}
        <div className="flex-1">
          <ProductGrid products={localizeProducts(items, locale)} locale={locale} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {page > 1 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/${locale}/products?page=${page - 1}`}>
                    {t("pagination.previous")}
                  </Link>
                </Button>
              )}
              <span className="text-muted-foreground text-sm">
                {t("pagination.page")} {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/${locale}/products?page=${page + 1}`}>
                    {t("pagination.next")}
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
