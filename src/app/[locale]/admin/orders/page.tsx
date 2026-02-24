import { getTranslations } from "next-intl/server";
import { getOrders } from "@/server/queries/orders";
import { OrdersClient } from "./orders-client";

type Props = {
  searchParams: Promise<{
    page?: string;
    status?: string;
    paymentStatus?: string;
    search?: string;
    fulfillmentStatus?: string;
    dateFrom?: string;
    dateTo?: string;
    amountMin?: string;
    amountMax?: string;
  }>;
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  const params = await searchParams;
  const t = await getTranslations("admin.orders");
  const page = Number(params.page) || 1;

  const result = await getOrders({
    page,
    pageSize: 20,
    status: params.status,
    paymentStatus: params.paymentStatus,
    search: params.search,
    fulfillmentStatus: params.fulfillmentStatus,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    amountMin: params.amountMin ? Number(params.amountMin) : undefined,
    amountMax: params.amountMax ? Number(params.amountMax) : undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>

      <OrdersClient
        orders={result.orders}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        currentStatus={params.status}
        currentPaymentStatus={params.paymentStatus}
        currentSearch={params.search}
        currentFulfillmentStatus={params.fulfillmentStatus}
        currentDateFrom={params.dateFrom}
        currentDateTo={params.dateTo}
        currentAmountMin={params.amountMin}
        currentAmountMax={params.amountMax}
      />
    </div>
  );
}
