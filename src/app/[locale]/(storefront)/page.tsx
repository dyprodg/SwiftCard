import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import { getFeaturedProducts } from "@/server/queries/products";
import { localizeProducts } from "@/lib/utils/localize-product";
import { organizationJsonLd } from "@/lib/seo/json-ld";
import { ProductGrid } from "@/components/storefront/product-grid";
import { Button } from "@/components/ui/button";
import { getShopSettings } from "@/lib/edge-config";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const settings = await getShopSettings();
  const url = `${APP_URL}/${locale}`;

  return {
    title: settings.shopName,
    description: settings.shopDescription ?? undefined,
    alternates: {
      canonical: url,
      languages: { de: `${APP_URL}/de`, en: `${APP_URL}/en` },
    },
    openGraph: {
      title: settings.shopName,
      description: settings.shopDescription ?? undefined,
      url,
      siteName: settings.shopName,
      locale,
      type: "website",
    },
  };
}

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getTranslations("common");
  const [featured, settings] = await Promise.all([
    getFeaturedProducts(6),
    getShopSettings(),
  ]);

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd(settings.shopName, APP_URL)),
        }}
      />
      {/* Hero Section */}
      <section className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {settings.shopName}
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg">
            {settings.shopDescription ??
              "Modern e-commerce built with Next.js, Drizzle & Vercel"}
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href={`/${locale}/products`}>
                {t("products")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">{t("featuredProducts")}</h2>
            <Button variant="ghost" asChild>
              <Link href={`/${locale}/products`}>
                {t("viewAll")}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <ProductGrid products={localizeProducts(featured, locale)} />
        </section>
      )}
    </div>
  );
}
