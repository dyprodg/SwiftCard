import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getActiveBundles } from "@/server/queries/bundles";
import { BundleCard } from "@/components/storefront/bundle-card";
import { getFeatureFlags } from "@/lib/edge-config";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function BundlesPage({ params }: Props) {
  const features = await getFeatureFlags();
  if (!features.bundles) notFound();

  const { locale } = await params;
  const t = await getTranslations("bundles");
  const bundles = await getActiveBundles();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>

      {bundles.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">{t("noResults")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {bundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
