import { getShopSettingsFromDb } from "@/server/queries/settings";
import { ShippingSettingsForm } from "@/components/admin/settings/shipping-settings-form";

export default async function ShippingSettingsPage() {
  const settings = await getShopSettingsFromDb();

  return (
    <ShippingSettingsForm
      defaultValues={{
        defaultShippingCost: settings?.defaultShippingCost ?? 990,
        freeShippingThreshold: settings?.freeShippingThreshold ?? null,
      }}
    />
  );
}
