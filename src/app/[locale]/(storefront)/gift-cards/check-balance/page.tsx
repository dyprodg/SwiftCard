import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getFeatureFlags } from "@/lib/edge-config";
import { BalanceChecker } from "./balance-checker";

export default async function CheckBalancePage() {
  const features = await getFeatureFlags();
  if (!features.giftCards) notFound();
  const t = await getTranslations("giftCards");

  return (
    <div className="container mx-auto max-w-md px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">{t("checkBalance")}</h1>
        <p className="text-muted-foreground mt-2">{t("checkBalanceDescription")}</p>
      </div>
      <BalanceChecker />
    </div>
  );
}
