import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getShippingZoneById } from "@/server/queries/shipping";
import { ShippingZoneForm } from "../shipping-zone-form";

export default async function EditShippingZonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("admin.shipping");
  const zone = await getShippingZoneById(id);

  if (!zone) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("editZone")}</h1>
      <ShippingZoneForm zone={zone} />
    </div>
  );
}
