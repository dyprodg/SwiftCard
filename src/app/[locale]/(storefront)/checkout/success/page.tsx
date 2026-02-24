import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Order Confirmation",
  robots: { index: false, follow: false },
};
import { CheckCircle, Clock } from "lucide-react";

import { db } from "@/db";
import { orders, orderItems } from "@/db/schema/orders";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils/format-price";
import { reconcileOrderWithStripe } from "@/lib/stripe/reconcile";
import { OrderStatusPoller } from "./order-status-poller";

type Props = {
  searchParams: Promise<{ order_id?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { order_id } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations("checkout.success");

  if (!order_id) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">{t("noOrder")}</p>
        <Button className="mt-4" asChild>
          <Link href={`/${locale}/products`}>{t("continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  // Try to reconcile immediately (covers most cases — webhook just hasn't arrived yet)
  await reconcileOrderWithStripe(order_id);

  const [order] = await db.select().from(orders).where(eq(orders.id, order_id));

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">{t("noOrder")}</p>
        <Button className="mt-4" asChild>
          <Link href={`/${locale}/products`}>{t("continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  const isPaid = order.paymentStatus === "PAID";

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <div className="mb-8 text-center">
        {isPaid ? (
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
        ) : (
          <Clock className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
        )}
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-2 text-lg">{t("message")}</p>
      </div>

      {/* Poll for status if still pending after server-side reconciliation */}
      {!isPaid && (
        <div className="mb-6">
          <OrderStatusPoller
            orderId={order.id}
            token={order.guestAccessToken}
            pendingMessage={t("paymentProcessing")}
            fallbackMessage={t("checkBackLater")}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {t("orderNumber")}: {order.orderNumber}
            </span>
            {!isPaid && (
              <span className="text-muted-foreground text-sm font-normal">
                {t("paymentProcessing")}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Order items */}
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.productName}
                {item.variantName && ` (${item.variantName})`} × {item.quantity}
              </span>
              <span>{formatPrice(item.total)}</span>
            </div>
          ))}

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{t("subtotal")}</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>
                  {t("discount")}
                  {order.discountCode && ` (${order.discountCode})`}
                </span>
                <span>-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>{order.taxInclusive ? t("taxIncluded") : t("tax")}</span>
              <span>{formatPrice(order.tax)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("shipping")}</span>
              <span>
                {order.shipping === 0 ? t("shippingFree") : formatPrice(order.shipping)}
              </span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between text-lg font-bold">
            <span>{t("total")}</span>
            <span>{formatPrice(order.total)}</span>
          </div>

          {/* Shipping address */}
          <Separator />
          <div className="text-sm">
            <p className="mb-1 font-medium">{t("shippingTo")}</p>
            <p>{order.shippingName}</p>
            <p>{order.shippingAddress1}</p>
            {order.shippingAddress2 && <p>{order.shippingAddress2}</p>}
            <p>
              {order.shippingZip} {order.shippingCity}
            </p>
            <p>{order.shippingCountry}</p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-center gap-4">
        <Button asChild variant="outline">
          <Link href={`/${locale}/order/${order.id}?token=${order.guestAccessToken}`}>
            {t("viewOrder")}
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/${locale}/products`}>{t("continueShopping")}</Link>
        </Button>
      </div>
    </div>
  );
}
