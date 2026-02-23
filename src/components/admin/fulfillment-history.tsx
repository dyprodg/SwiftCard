"use client";

import { useTranslations, useLocale } from "next-intl";
import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CARRIER_LABELS, type Carrier } from "@/lib/constants/carriers";
import type { OrderWithItemsAndRefundsAndFulfillments } from "@/types";

type FulfillmentHistoryProps = {
  order: OrderWithItemsAndRefundsAndFulfillments;
};

export function FulfillmentHistory({ order }: FulfillmentHistoryProps) {
  const t = useTranslations("admin.orders.fulfillment");
  const locale = useLocale();
  const dateLocale = locale === "de" ? "de-CH" : "en-CH";

  if (order.fulfillments.length === 0) return null;

  // Summary: total fulfilled vs ordered
  const totalOrdered = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalFulfilled = order.fulfillments.reduce(
    (sum, f) => sum + f.items.reduce((s, fi) => s + fi.quantity, 0),
    0,
  );

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-semibold">{t("history.title")}</h2>
      <div className="space-y-4">
        {order.fulfillments.map((fulfillment) => {
          const carrierLabel = fulfillment.carrier
            ? fulfillment.carrier === "OTHER"
              ? fulfillment.carrierOther ?? "Other"
              : CARRIER_LABELS[fulfillment.carrier as Carrier]
            : null;

          return (
            <div key={fulfillment.id} className="rounded-md border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {carrierLabel && (
                    <span className="text-sm font-medium">{carrierLabel}</span>
                  )}
                  {fulfillment.trackingNumber && (
                    <span className="text-muted-foreground text-sm">
                      #{fulfillment.trackingNumber}
                    </span>
                  )}
                </div>
                <span className="text-muted-foreground text-xs">
                  {new Date(fulfillment.createdAt).toLocaleString(dateLocale)}
                </span>
              </div>

              {fulfillment.trackingUrl && (
                <a
                  href={fulfillment.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  {t("history.trackPackage")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}

              <div className="mt-2 space-y-1 text-xs">
                {fulfillment.note && (
                  <p>
                    <span className="text-muted-foreground">{t("note")}: </span>
                    {fulfillment.note}
                  </p>
                )}
                <p>
                  <span className="text-muted-foreground">{t("history.createdBy")}: </span>
                  {fulfillment.createdBy}
                </p>
              </div>

              {fulfillment.items.length > 0 && (
                <div className="mt-2 space-y-1">
                  {fulfillment.items.map((fi) => {
                    const oi = order.items.find((i) => i.id === fi.orderItemId);
                    return (
                      <div
                        key={fi.id}
                        className="text-muted-foreground flex justify-between text-xs"
                      >
                        <span>
                          {oi?.productName ?? "Unknown"}
                          {oi?.variantName ? ` - ${oi.variantName}` : ""}
                        </span>
                        <span>x {fi.quantity}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-muted-foreground mt-4 text-sm">
        {t("history.summary", { fulfilled: totalFulfilled, total: totalOrdered })}
      </div>
    </Card>
  );
}
