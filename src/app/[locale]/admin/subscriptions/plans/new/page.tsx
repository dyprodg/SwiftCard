import { getTranslations } from "next-intl/server";

import { SubscriptionPlanForm } from "@/components/admin/subscription-plan-form";

export default async function NewSubscriptionPlanPage() {
  const t = await getTranslations("admin.subscriptions");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("newPlan")}</h1>
      </div>
      <SubscriptionPlanForm />
    </div>
  );
}
