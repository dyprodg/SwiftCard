import { getReservationSettings } from "@/lib/edge-config";
import { ReservationSettingsForm } from "@/components/admin/settings/reservation-settings-form";

export default async function ReservationSettingsPage() {
  const settings = await getReservationSettings();

  return <ReservationSettingsForm defaultValues={settings} />;
}
