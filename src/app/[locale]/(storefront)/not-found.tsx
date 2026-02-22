import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function StorefrontNotFound() {
  const locale = await getLocale();
  const t = await getTranslations("errors.notFound");

  return (
    <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <h2 className="text-2xl font-bold">{t("title")}</h2>
      <p className="text-muted-foreground">{t("description")}</p>
      <Button asChild>
        <Link href={`/${locale}`}>{t("button")}</Link>
      </Button>
    </div>
  );
}
