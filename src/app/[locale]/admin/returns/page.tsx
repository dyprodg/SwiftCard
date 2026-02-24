import { getTranslations } from "next-intl/server";
import { getAdminReturns, getReturnStats } from "@/server/queries/returns";
import { ReturnsClient } from "./returns-client";

export default async function AdminReturnsPage() {
  const t = await getTranslations("admin.returns");
  const [items, stats] = await Promise.all([getAdminReturns(), getReturnStats()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <ReturnsClient returns={items} stats={stats} />
    </div>
  );
}
