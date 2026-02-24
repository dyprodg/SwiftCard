import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getReturnById } from "@/server/queries/returns";
import { ReturnDetailClient } from "./return-detail-client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminReturnDetailPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("admin.returns");

  const returnRecord = await getReturnById(id);
  if (!returnRecord) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {t("detail.title")} {returnRecord.id.slice(0, 8)}...
        </h1>
      </div>
      <ReturnDetailClient returnData={returnRecord} />
    </div>
  );
}
