import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { GdprClient } from "./gdpr-client";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function GdprDataPage() {
  const { userId } = await auth();
  const locale = await getLocale();

  if (!userId) {
    redirect(`/${locale}/sign-in`);
  }

  const t = await getTranslations("gdpr");

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground mb-8">{t("description")}</p>
      <GdprClient />
    </div>
  );
}
