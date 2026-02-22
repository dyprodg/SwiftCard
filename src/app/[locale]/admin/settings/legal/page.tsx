import { getShopSettingsFromDb } from "@/server/queries/settings";
import { LegalSettingsForm } from "@/components/admin/settings/legal-settings-form";

export default async function LegalSettingsPage() {
  const settings = await getShopSettingsFromDb();

  return (
    <LegalSettingsForm
      defaultValues={{
        termsUrl: settings?.termsUrl ?? "",
        privacyUrl: settings?.privacyUrl ?? "",
        imprintUrl: settings?.imprintUrl ?? "",
      }}
    />
  );
}
