import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getShopSettings } from "@/lib/edge-config";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("legal.imprint");
  const otherLocale = locale === "de" ? "en" : "de";

  return {
    title: t("title"),
    description: t("meta"),
    alternates: {
      canonical: `${APP_URL}/${locale}/imprint`,
      languages: {
        [locale]: `${APP_URL}/${locale}/imprint`,
        [otherLocale]: `${APP_URL}/${otherLocale}/imprint`,
      },
    },
  };
}

export default async function ImprintPage() {
  const t = await getTranslations("legal.imprint");
  const settings = await getShopSettings();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">{t("title")}</h1>

      <div className="space-y-8">
        <section>
          <h2 className="mb-2 text-xl font-semibold">{t("companyInfo")}</h2>
          <p className="text-muted-foreground">{settings.shopName}</p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">{t("contact")}</h2>
          <p className="text-muted-foreground">
            {t("email")}:{" "}
            <a
              href={`mailto:${settings.contactEmail}`}
              className="text-foreground underline underline-offset-4"
            >
              {settings.contactEmail}
            </a>
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">{t("disclaimer")}</h2>
          <p className="text-muted-foreground leading-relaxed">{t("disclaimerText")}</p>
        </section>
      </div>
    </div>
  );
}
