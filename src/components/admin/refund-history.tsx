"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils/format-price";
import type { OrderWithItemsAndRefunds } from "@/types";

type RefundHistoryProps = {
  order: OrderWithItemsAndRefunds;
};

export function RefundHistory({ order }: RefundHistoryProps) {
  const t = useTranslations("admin.orders.refund");
  const locale = useLocale();
  const dateLocale = locale === "de" ? "de-CH" : "en-CH";

  if (order.refunds.length === 0) return null;

  const remainingRefundable = order.total - order.totalRefunded;

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-semibold">{t("history.title")}</h2>
      <div className="space-y-4">
        {order.refunds.map((refund) => (
          <div key={refund.id} className="rounded-md border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {formatPrice(refund.amount, refund.currency)}
                </span>
                <Badge
                  variant="outline"
                  className={
                    refund.isFullRefund
                      ? "border-gray-200 bg-gray-100 text-gray-700"
                      : "border-orange-200 bg-orange-100 text-orange-700"
                  }
                >
                  {refund.isFullRefund ? t("history.full") : t("history.partial")}
                </Badge>
              </div>
              <span className="text-muted-foreground text-xs">
                {new Date(refund.createdAt).toLocaleString(dateLocale)}
              </span>
            </div>

            <div className="mt-2 space-y-1 text-xs">
              <p>
                <span className="text-muted-foreground">{t("reason")}: </span>
                {t(`reasons.${refund.reason}`)}
              </p>
              {refund.note && (
                <p>
                  <span className="text-muted-foreground">{t("note")}: </span>
                  {refund.note}
                </p>
              )}
              <p>
                <span className="text-muted-foreground">
                  {t("history.processedBy")}:{" "}
                </span>
                {refund.createdBy === "stripe-webhook"
                  ? t("history.stripeWebhook")
                  : refund.createdBy}
              </p>
              {refund.stockRestored && (
                <p className="text-green-600">{t("history.stockRestored")}</p>
              )}
            </div>

            {refund.items.length > 0 && (
              <div className="mt-2 space-y-1">
                {refund.items.map((ri) => {
                  const oi = order.items.find((i) => i.id === ri.orderItemId);
                  return (
                    <div
                      key={ri.id}
                      className="text-muted-foreground flex justify-between text-xs"
                    >
                      <span>
                        {oi?.productName ?? "Unknown"}
                        {oi?.variantName ? ` - ${oi.variantName}` : ""} x {ri.quantity}
                      </span>
                      <span>{formatPrice(ri.amount, refund.currency)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <Separator className="my-4" />

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("history.totalRefunded")}</span>
          <span className="font-medium">
            {formatPrice(order.totalRefunded, order.currency)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("history.remaining")}</span>
          <span className="font-medium">
            {formatPrice(remainingRefundable, order.currency)}
          </span>
        </div>
      </div>
    </Card>
  );
}
