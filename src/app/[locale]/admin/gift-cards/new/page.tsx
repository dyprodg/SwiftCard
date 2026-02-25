import { getTranslations } from "next-intl/server";
import { GiftCardForm } from "@/components/admin/gift-card-form";

export default async function NewGiftCardPage() {
  const t = await getTranslations("admin.giftCards");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("issue")}</h1>
        <p className="text-muted-foreground">{t("issueDescription")}</p>
      </div>
      <GiftCardForm />
    </div>
  );
}
