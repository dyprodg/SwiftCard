"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Package,
  CreditCard,
  Truck,
  RefreshCw,
  MapPin,
  MessageSquare,
  StickyNote,
  ShoppingCart,
  Activity,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { OrderEvent } from "@/types";

const EVENT_ICONS: Record<string, typeof Activity> = {
  ORDER_CREATED: ShoppingCart,
  STATUS_CHANGED: RefreshCw,
  PAYMENT_STATUS_CHANGED: CreditCard,
  FULFILLMENT_CREATED: Truck,
  FULFILLMENT_STATUS_CHANGED: Package,
  REFUND_CREATED: CreditCard,
  SHIPPING_ADDRESS_EDITED: MapPin,
  CUSTOMER_NOTE_EDITED: MessageSquare,
  INTERNAL_NOTE_ADDED: StickyNote,
  DISPUTE_OPENED: AlertTriangle,
  DISPUTE_CLOSED: CheckCircle,
};

function ActorDisplay({ createdBy }: { createdBy: string | null }) {
  if (!createdBy) return <span>System</span>;
  if (createdBy === "stripe") return <span>Stripe</span>;
  // Show truncated user ID for admin users
  return <span>{createdBy.slice(0, 12)}...</span>;
}

export function ActivityLog({ events }: { events: OrderEvent[] }) {
  const locale = useLocale();
  const t = useTranslations("admin.orders.activity");
  const dateLocale = locale === "de" ? "de-CH" : "en-CH";

  if (events.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">{t("title")}</h2>
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-semibold">{t("title")}</h2>
      <div className="relative space-y-0">
        {/* Vertical timeline line */}
        <div className="bg-border absolute top-0 bottom-0 left-4 w-px" />

        {events.map((event) => {
          const Icon = EVENT_ICONS[event.type] ?? Activity;
          const data = (event.data ?? {}) as Record<string, unknown>;

          return (
            <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Icon circle */}
              <div className="bg-background relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border">
                <Icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-medium">
                  <EventDescription type={event.type} data={data} t={t} />
                </p>
                <p className="text-muted-foreground text-xs">
                  {new Date(event.createdAt).toLocaleString(dateLocale)} &middot;{" "}
                  <ActorDisplay createdBy={event.createdBy} />
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function EventDescription({
  type,
  data,
  t,
}: {
  type: string;
  data: Record<string, unknown>;
  t: ReturnType<typeof useTranslations>;
}) {
  switch (type) {
    case "ORDER_CREATED":
      return <>{t("orderCreated")}</>;
    case "STATUS_CHANGED":
      return (
        <>
          {t("statusChanged", {
            from: String(data.from ?? ""),
            to: String(data.to ?? ""),
          })}
        </>
      );
    case "PAYMENT_STATUS_CHANGED":
      return (
        <>
          {t("paymentStatusChanged", {
            from: String(data.from ?? ""),
            to: String(data.to ?? ""),
          })}
        </>
      );
    case "FULFILLMENT_CREATED":
      return <>{t("fulfillmentCreated")}</>;
    case "FULFILLMENT_STATUS_CHANGED":
      return (
        <>
          {t("fulfillmentStatusChanged", {
            from: String(data.from ?? ""),
            to: String(data.to ?? ""),
          })}
        </>
      );
    case "REFUND_CREATED": {
      const amount = data.amount;
      return (
        <>
          {t("refundCreated")}
          {typeof amount === "number" && ` (${(amount / 100).toFixed(2)} CHF)`}
        </>
      );
    }
    case "SHIPPING_ADDRESS_EDITED":
      return <>{t("shippingAddressEdited")}</>;
    case "CUSTOMER_NOTE_EDITED":
      return <>{t("customerNoteEdited")}</>;
    case "INTERNAL_NOTE_ADDED":
      return <>{t("internalNoteAdded")}</>;
    case "DISPUTE_OPENED":
      return <>{t("disputeOpened", { reason: String(data.reason ?? "unknown") })}</>;
    case "DISPUTE_CLOSED":
      return <>{t("disputeClosed", { status: String(data.status ?? "unknown") })}</>;
    default:
      return <>{type}</>;
  }
}
