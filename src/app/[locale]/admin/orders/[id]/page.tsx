import { notFound } from "next/navigation";
import { getOrderByIdFull } from "@/server/queries/orders";
import { OrderDetailClient } from "./order-detail-client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await getOrderByIdFull(id);

  if (!order) {
    notFound();
  }

  return <OrderDetailClient order={order} />;
}
