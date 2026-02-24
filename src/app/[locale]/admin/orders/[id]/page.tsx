import { notFound } from "next/navigation";
import { getOrderByIdFull, getOrderEvents } from "@/server/queries/orders";
import { OrderDetailClient } from "./order-detail-client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const [order, events] = await Promise.all([getOrderByIdFull(id), getOrderEvents(id)]);

  if (!order) {
    notFound();
  }

  return <OrderDetailClient order={order} events={events} />;
}
