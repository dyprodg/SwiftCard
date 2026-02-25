import { getTranslations } from "next-intl/server";
import { CampaignForm } from "@/components/admin/campaign-form";

export default async function NewCampaignPage() {
  const t = await getTranslations("admin.emailMarketing");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("newCampaign")}</h1>
      </div>
      <CampaignForm />
    </div>
  );
}
