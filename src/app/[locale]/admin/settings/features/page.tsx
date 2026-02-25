import { getFeatureFlags } from "@/lib/edge-config";
import { FeatureFlagsForm } from "@/components/admin/settings/feature-flags-form";

export default async function FeatureSettingsPage() {
  const flags = await getFeatureFlags();

  return <FeatureFlagsForm defaultValues={flags} />;
}
