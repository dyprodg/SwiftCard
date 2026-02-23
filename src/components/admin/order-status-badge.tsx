"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusClasses: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
  PROCESSING: "bg-purple-100 text-purple-800 border-purple-200",
  SHIPPED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  REFUNDED: "bg-gray-100 text-gray-800 border-gray-200",
};

const paymentStatusClasses: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PAID: "bg-green-100 text-green-800 border-green-200",
  FAILED: "bg-red-100 text-red-800 border-red-200",
  REFUNDED: "bg-gray-100 text-gray-800 border-gray-200",
  PARTIALLY_REFUNDED: "bg-orange-100 text-orange-800 border-orange-200",
};

export function OrderStatusBadge({ status }: { status: string }) {
  const t = useTranslations("admin.orders.statuses");
  const className = statusClasses[status] ?? "";
  return (
    <Badge variant="outline" className={cn("border", className)}>
      {t(
        status as
          | "PENDING"
          | "CONFIRMED"
          | "PROCESSING"
          | "SHIPPED"
          | "DELIVERED"
          | "CANCELLED"
          | "REFUNDED",
      )}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const t = useTranslations("admin.orders.paymentStatuses");
  const className = paymentStatusClasses[status] ?? "";
  return (
    <Badge variant="outline" className={cn("border", className)}>
      {t(status as "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED")}
    </Badge>
  );
}

const fulfillmentStatusClasses: Record<string, string> = {
  UNFULFILLED: "bg-gray-100 text-gray-800 border-gray-200",
  PARTIALLY_FULFILLED: "bg-amber-100 text-amber-800 border-amber-200",
  FULFILLED: "bg-green-100 text-green-800 border-green-200",
  RETURNED: "bg-red-100 text-red-800 border-red-200",
};

export function FulfillmentStatusBadge({ status }: { status: string }) {
  const t = useTranslations("admin.orders.fulfillmentStatuses");
  const className = fulfillmentStatusClasses[status] ?? "";
  return (
    <Badge variant="outline" className={cn("border", className)}>
      {t(
        status as "UNFULFILLED" | "PARTIALLY_FULFILLED" | "FULFILLED" | "RETURNED",
      )}
    </Badge>
  );
}
