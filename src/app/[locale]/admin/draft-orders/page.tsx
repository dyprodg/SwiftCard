import { getTranslations } from "next-intl/server";
import { getDraftOrders } from "@/server/queries/draft-orders";
import { DraftOrdersClient } from "./draft-orders-client";

export default async function AdminDraftOrdersPage() {
  const t = await getTranslations("admin.draftOrders");
  const drafts = await getDraftOrders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>
      <DraftOrdersClient orders={drafts} />
    </div>
  );
}
