import { getTranslations } from "next-intl/server";
import { DraftOrderForm } from "../draft-order-form";

export default async function NewDraftOrderPage() {
  const t = await getTranslations("admin.draftOrders");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("createTitle")}</h1>
        <p className="text-muted-foreground text-sm">{t("createDescription")}</p>
      </div>
      <DraftOrderForm />
    </div>
  );
}
