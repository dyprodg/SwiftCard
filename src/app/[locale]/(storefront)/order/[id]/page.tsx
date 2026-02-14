import { notFound } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getLocale, getTranslations } from "next-intl/server";

import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { eq } from "drizzle-orm";
import { OrderViewClient } from "./order-view-client";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function OrderViewPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { token } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations("orderView");

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { items: true },
  });

  if (!order) notFound();

  // Authorize: token match OR logged-in user email match
  let authorized = false;

  if (token && order.guestAccessToken === token) {
    authorized = true;
  } else {
    const { userId } = await auth();
    if (userId) {
      const user = await currentUser();
      const email = user?.emailAddresses[0]?.emailAddress;
      if (email && email === order.customerEmail) {
        authorized = true;
      }
    }
  }

  if (!authorized) notFound();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>
      <OrderViewClient
        order={{
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          subtotal: order.subtotal,
          tax: order.tax,
          shipping: order.shipping,
          total: order.total,
          currency: order.currency,
          shippingName: order.shippingName,
          shippingAddress1: order.shippingAddress1,
          shippingAddress2: order.shippingAddress2,
          shippingCity: order.shippingCity,
          shippingZip: order.shippingZip,
          shippingCountry: order.shippingCountry,
          createdAt: order.createdAt.toISOString(),
          items: order.items.map((item) => ({
            id: item.id,
            productName: item.productName,
            variantName: item.variantName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        }}
        token={order.guestAccessToken}
        locale={locale}
        translations={{
          orderNumber: t("orderNumber"),
          date: t("date"),
          status: t("status"),
          paymentStatus: t("paymentStatus"),
          items: t("items"),
          subtotal: t("subtotal"),
          tax: t("tax"),
          shipping: t("shipping"),
          shippingFree: t("shippingFree"),
          total: t("total"),
          shippingAddress: t("shippingAddress"),
          retryPayment: t("retryPayment"),
          retryBanner: t("retryBanner"),
          processing: t("processing"),
          paymentFailed: t("paymentFailed"),
          continueShopping: t("continueShopping"),
        }}
      />
    </div>
  );
}
