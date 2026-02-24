import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { GdprClient } from "./gdpr-client";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function GdprDataPage() {
  const t = await getTranslations("gdpr");

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">{t("title")}</h2>
      <p className="text-muted-foreground mb-6 text-sm">{t("description")}</p>
      <GdprClient />
    </div>
  );
}
