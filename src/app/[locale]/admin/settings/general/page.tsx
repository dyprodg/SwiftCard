import { getShopSettingsFromDb } from "@/server/queries/settings";
import { GeneralSettingsForm } from "@/components/admin/settings/general-settings-form";

export default async function GeneralSettingsPage() {
  const settings = await getShopSettingsFromDb();

  return (
    <GeneralSettingsForm
      defaultValues={{
        shopName: settings?.shopName ?? "SwiftCart",
        shopDescription: settings?.shopDescription ?? "",
        contactEmail: settings?.contactEmail ?? "",
        allowGuestCheckout: settings?.allowGuestCheckout ?? true,
      }}
    />
  );
}
