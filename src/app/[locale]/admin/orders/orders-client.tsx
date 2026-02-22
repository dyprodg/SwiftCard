"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/admin/data-table";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/admin/order-status-badge";
import { formatPrice } from "@/lib/utils/format-price";
import type { Order } from "@/types";

type Props = {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  currentStatus?: string;
  currentPaymentStatus?: string;
  currentSearch?: string;
};

export function OrdersClient({
  orders,
  total,
  page,
  pageSize,
  currentStatus,
  currentPaymentStatus,
  currentSearch,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("admin.orders");

  function updateParams(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset to page 1 on filter change
    router.push(`${pathname}?${params.toString()}`);
  }

  const columns: Column<Order>[] = [
    {
      header: t("order"),
      cell: (row) => (
        <Link
          href={`/${locale}/admin/orders/${row.id}`}
          className="font-medium hover:underline"
        >
          {row.orderNumber}
        </Link>
      ),
    },
    {
      header: t("customer"),
      cell: (row) => (
        <div>
          <p className="text-sm font-medium">{row.shippingName}</p>
          <p className="text-muted-foreground text-xs">{row.customerEmail}</p>
        </div>
      ),
    },
    {
      header: t("status"),
      cell: (row) => <OrderStatusBadge status={row.status} />,
    },
    {
      header: t("payment"),
      cell: (row) => <PaymentStatusBadge status={row.paymentStatus} />,
    },
    {
      header: t("total"),
      cell: (row) => (
        <span className="font-medium">{formatPrice(row.total, row.currency)}</span>
      ),
      className: "text-right",
    },
    {
      header: t("date"),
      cell: (row) => (
        <span className="text-muted-foreground text-sm">
          {new Date(row.createdAt).toLocaleDateString(
            locale === "de" ? "de-CH" : "en-CH",
          )}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t("searchPlaceholder")}
            defaultValue={currentSearch}
            className="pl-9"
            onChange={(e) => {
              const value = e.target.value;
              if (value.length === 0 || value.length >= 2) {
                updateParams("search", value || undefined);
              }
            }}
          />
        </div>

        <Select
          value={currentStatus ?? "all"}
          onValueChange={(v: string) =>
            updateParams("status", v === "all" ? undefined : v)
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t("status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            <SelectItem value="PENDING">{t("statuses.PENDING")}</SelectItem>
            <SelectItem value="CONFIRMED">{t("statuses.CONFIRMED")}</SelectItem>
            <SelectItem value="PROCESSING">{t("statuses.PROCESSING")}</SelectItem>
            <SelectItem value="SHIPPED">{t("statuses.SHIPPED")}</SelectItem>
            <SelectItem value="DELIVERED">{t("statuses.DELIVERED")}</SelectItem>
            <SelectItem value="CANCELLED">{t("statuses.CANCELLED")}</SelectItem>
            <SelectItem value="REFUNDED">{t("statuses.REFUNDED")}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={currentPaymentStatus ?? "all"}
          onValueChange={(v: string) =>
            updateParams("paymentStatus", v === "all" ? undefined : v)
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t("payment")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allPayments")}</SelectItem>
            <SelectItem value="PENDING">{t("paymentStatuses.PENDING")}</SelectItem>
            <SelectItem value="PAID">{t("paymentStatuses.PAID")}</SelectItem>
            <SelectItem value="FAILED">{t("paymentStatuses.FAILED")}</SelectItem>
            <SelectItem value="REFUNDED">{t("paymentStatuses.REFUNDED")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={orders as (Order & { id: string })[]}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={(p) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("page", String(p));
          router.push(`${pathname}?${params.toString()}`);
        }}
      />
    </div>
  );
}
