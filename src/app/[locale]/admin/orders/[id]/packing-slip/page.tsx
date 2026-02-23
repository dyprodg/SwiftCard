import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getOrderByIdFull } from "@/server/queries/orders";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PackingSlipPage({ params }: Props) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") notFound();

  const { id } = await params;
  const order = await getOrderByIdFull(id);
  if (!order) notFound();

  const t = await getTranslations("admin.orders.packingSlip");

  return (
    <div className="mx-auto max-w-2xl p-8">
      {/* Print button - hidden when printing */}
      <div className="mb-8 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          {t("print")}
        </button>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("order")}: {order.orderNumber}
          </p>
          <p className="text-muted-foreground text-sm">
            {t("date")}: {new Date(order.createdAt).toLocaleDateString("de-CH")}
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="font-bold">SwiftCard</p>
        </div>
      </div>

      {/* Ship To */}
      <div className="mb-8">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide">
          {t("shipTo")}
        </h2>
        <div className="text-sm">
          <p>{order.shippingName}</p>
          <p>{order.shippingAddress1}</p>
          {order.shippingAddress2 && <p>{order.shippingAddress2}</p>}
          <p>
            {order.shippingZip} {order.shippingCity}
          </p>
          <p>{order.shippingCountry}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="py-2 text-left">{t("item")}</th>
            <th className="py-2 text-left">{t("variant")}</th>
            <th className="py-2 text-right">{t("quantity")}</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="py-2">{item.productName}</td>
              <td className="py-2">{item.variantName ?? "-"}</td>
              <td className="py-2 text-right">{item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Customer Note */}
      {order.customerNote && (
        <div className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide">
            {t("customerNote")}
          </h2>
          <p className="text-sm">{order.customerNote}</p>
        </div>
      )}
    </div>
  );
}
