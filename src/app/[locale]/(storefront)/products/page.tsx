import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { getActiveProducts } from "@/server/queries/products";
import { getCategories } from "@/server/queries/categories";
import { ProductGrid } from "@/components/storefront/product-grid";
import { Button } from "@/components/ui/button";

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
  const page = parseInt(sp.page ?? "1");
  const pageSize = 12;

  const [{ items, total }, categories] = await Promise.all([
    getActiveProducts(pageSize, (page - 1) * pageSize),
    getCategories(),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">
          {total} {t("productsFound")}
        </p>
      </div>

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
          <ProductGrid products={items} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {page > 1 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/${locale}/products?page=${page - 1}`}>Previous</Link>
                </Button>
              )}
              <span className="text-muted-foreground text-sm">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/${locale}/products?page=${page + 1}`}>Next</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
