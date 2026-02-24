import { getTranslations } from "next-intl/server";
import { getAllTaxZones } from "@/server/queries/shipping";
import { TaxZonesClient } from "./tax-zones-client";

export default async function TaxPage() {
  const t = await getTranslations("admin.tax");
  const zones = await getAllTaxZones();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>
      <TaxZonesClient initialZones={zones} />
    </div>
  );
}
