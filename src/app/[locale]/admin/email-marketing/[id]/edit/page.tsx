import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getCampaignById } from "@/server/queries/newsletter";
import { CampaignForm } from "@/components/admin/campaign-form";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function EditCampaignPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("admin.emailMarketing");
  const campaign = await getCampaignById(id);

  if (!campaign) notFound();
  if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("editCampaign")}</h1>
      </div>
      <CampaignForm campaign={campaign} />
    </div>
  );
}
