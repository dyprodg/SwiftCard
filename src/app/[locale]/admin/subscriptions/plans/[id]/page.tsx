import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getSubscriptionPlanById } from "@/server/queries/subscriptions";
import { SubscriptionPlanForm } from "@/components/admin/subscription-plan-form";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function EditSubscriptionPlanPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("admin.subscriptions");
  const plan = await getSubscriptionPlanById(id);

  if (!plan) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("editPlan")}</h1>
      </div>
      <SubscriptionPlanForm plan={plan} />
    </div>
  );
}
