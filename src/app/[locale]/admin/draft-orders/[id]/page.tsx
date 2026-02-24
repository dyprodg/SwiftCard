import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getDraftOrderById } from "@/server/queries/draft-orders";
import { DraftOrderForm } from "../draft-order-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditDraftOrderPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("admin.draftOrders");
  const order = await getDraftOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {t("editTitle")} — {order.orderNumber}
        </h1>
        <p className="text-muted-foreground text-sm">{t("editDescription")}</p>
      </div>
      <DraftOrderForm existingOrder={order} />
    </div>
  );
}
