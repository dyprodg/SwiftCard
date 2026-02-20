import { getShopSettingsFromDb } from "@/server/queries/settings";
import { PaymentSettingsForm } from "@/components/admin/settings/payment-settings-form";

export default async function PaymentSettingsPage() {
  const settings = await getShopSettingsFromDb();

  return (
    <PaymentSettingsForm
      defaultValues={{
        currency: settings?.currency ?? "CHF",
        defaultTaxRate: settings?.defaultTaxRate ?? 0.081,
      }}
    />
  );
}
