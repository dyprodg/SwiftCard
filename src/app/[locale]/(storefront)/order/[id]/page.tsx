import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";

export const metadata: Metadata = {
  title: "Order Details",
  robots: { index: false, follow: false },
};
import { getLocale, getTranslations } from "next-intl/server";

import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { eq } from "drizzle-orm";
import { OrderViewClient } from "./order-view-client";
import { CARRIER_LABELS, type Carrier } from "@/lib/constants/carriers";
import {
  canRequestReturn,
  getReturnedQuantities,
  getReturnsByOrder,
} from "@/server/queries/returns";

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
    with: {
      items: true,
      fulfillments: { with: { items: true } },
      returns: { with: { items: true } },
    },
  });

  if (!order) notFound();

  // Authorize: token match OR logged-in user email match
  const { userId } = await auth();
  let authorized = false;
  let userEmail: string | undefined;

  if (token && order.guestAccessToken === token) {
    authorized = true;
  }

  if (userId) {
    const user = await currentUser();
    userEmail = user?.emailAddresses[0]?.emailAddress;
    if (userEmail && userEmail === order.customerEmail) {
      authorized = true;
    }
  }

  if (!authorized) notFound();

  // Check return eligibility for logged-in users
  let returnEligible = false;
  let returnedQuantities: Record<string, number> = {};
  if (userId) {
    const eligibility = await canRequestReturn(order.id, {
      customerId: userId,
      customerEmail: userEmail,
    });
    returnEligible = eligibility.eligible;
    if (returnEligible) {
      returnedQuantities = await getReturnedQuantities(order.id);
    }
  }

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
          discountAmount: order.discountAmount,
          discountCode: order.discountCode,
          taxInclusive: order.taxInclusive,
          shippingMethod: order.shippingMethod,
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
          fulfillments: order.fulfillments.map((f) => ({
            id: f.id,
            carrier: f.carrier,
            carrierOther: f.carrierOther,
            carrierLabel: f.carrier
              ? f.carrier === "OTHER"
                ? (f.carrierOther ?? "Other")
                : CARRIER_LABELS[f.carrier as Carrier]
              : null,
            trackingNumber: f.trackingNumber,
            trackingUrl: f.trackingUrl,
            createdAt: f.createdAt.toISOString(),
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
          discount: t("discount"),
          tax: t("tax"),
          taxIncluded: t("taxIncluded"),
          shipping: t("shipping"),
          shippingFree: t("shippingFree"),
          total: t("total"),
          shippingAddress: t("shippingAddress"),
          retryPayment: t("retryPayment"),
          retryBanner: t("retryBanner"),
          processing: t("processing"),
          paymentFailed: t("paymentFailed"),
          paymentBeingProcessed: t("paymentBeingProcessed"),
          continueShopping: t("continueShopping"),
          tracking: t("tracking"),
          trackPackage: t("trackPackage"),
          requestReturn: t("requestReturn"),
          returnStatus: t("returnStatus"),
        }}
        returnEligible={returnEligible}
        returnedQuantities={returnedQuantities}
        existingReturns={order.returns.map((r) => ({
          id: r.id,
          status: r.status,
          reason: r.reason,
          createdAt: r.createdAt.toISOString(),
          items: r.items.map((ri) => ({
            orderItemId: ri.orderItemId,
            quantity: ri.quantity,
          })),
        }))}
      />
    </div>
  );
}
