import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("legal.terms");
  const otherLocale = locale === "de" ? "en" : "de";

  return {
    title: t("title"),
    description: t("meta"),
    alternates: {
      canonical: `${APP_URL}/${locale}/terms`,
      languages: {
        [locale]: `${APP_URL}/${locale}/terms`,
        [otherLocale]: `${APP_URL}/${otherLocale}/terms`,
      },
    },
  };
}

const sectionKeys = [
  "general",
  "orders",
  "shipping",
  "returns",
  "liability",
  "jurisdiction",
] as const;

export default async function TermsPage() {
  const t = await getTranslations("legal.terms");

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground mb-8 text-sm">{t("lastUpdated")}</p>

      <div className="space-y-8">
        {sectionKeys.map((key) => (
          <section key={key}>
            <h2 className="mb-2 text-xl font-semibold">
              {t(`${key}Title` as Parameters<typeof t>[0])}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t(`${key}Content` as Parameters<typeof t>[0])}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
