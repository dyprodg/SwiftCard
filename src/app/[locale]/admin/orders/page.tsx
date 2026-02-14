import { getOrders } from "@/server/queries/orders";
import { OrdersClient } from "./orders-client";

type Props = {
  searchParams: Promise<{
    page?: string;
    status?: string;
    paymentStatus?: string;
    search?: string;
  }>;
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const result = await getOrders({
    page,
    pageSize: 20,
    status: params.status,
    paymentStatus: params.paymentStatus,
    search: params.search,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground text-sm">Manage and track customer orders</p>
      </div>

      <OrdersClient
        orders={result.orders}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        currentStatus={params.status}
        currentPaymentStatus={params.paymentStatus}
        currentSearch={params.search}
      />
    </div>
  );
}
