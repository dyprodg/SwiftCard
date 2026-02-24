import { getReturnSettings } from "@/lib/edge-config";
import { ReturnSettingsForm } from "@/components/admin/settings/return-settings-form";

export default async function ReturnSettingsPage() {
  const settings = await getReturnSettings();

  return <ReturnSettingsForm defaultValues={settings} />;
}
