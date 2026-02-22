import { Construction } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function MaintenancePage() {
  const t = await getTranslations("maintenance");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Construction className="text-muted-foreground mb-6 h-16 w-16" />
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground mt-4 max-w-md text-lg">{t("message")}</p>
    </div>
  );
}
