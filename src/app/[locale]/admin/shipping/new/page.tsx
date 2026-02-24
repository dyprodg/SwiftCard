import { getTranslations } from "next-intl/server";
import { ShippingZoneForm } from "../shipping-zone-form";

export default async function NewShippingZonePage() {
  const t = await getTranslations("admin.shipping");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("createZone")}</h1>
      <ShippingZoneForm />
    </div>
  );
}
