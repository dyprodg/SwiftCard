"use client";

import { useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Search, Download, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { bulkUpdateOrderStatus } from "@/server/actions/orders";
import type { Order } from "@/types";

type Props = {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  currentStatus?: string;
  currentPaymentStatus?: string;
  currentSearch?: string;
  currentFulfillmentStatus?: string;
  currentDateFrom?: string;
  currentDateTo?: string;
  currentAmountMin?: string;
  currentAmountMax?: string;
};

export function OrdersClient({
  orders,
  total,
  page,
  pageSize,
  currentStatus,
  currentPaymentStatus,
  currentSearch,
  currentFulfillmentStatus,
  currentDateFrom,
  currentDateTo,
  currentAmountMin,
  currentAmountMax,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("admin.orders");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

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

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === orders.length) {
        return new Set();
      }
      return new Set(orders.map((o) => o.id));
    });
  }, [orders]);

  async function handleBulkStatus(newStatus: string) {
    if (selectedIds.size === 0) return;
    setBulkUpdating(true);
    await bulkUpdateOrderStatus({
      orderIds: Array.from(selectedIds),
      newStatus,
    });
    setSelectedIds(new Set());
    setBulkUpdating(false);
  }

  function handleExportCSV() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    window.open(`/api/admin/orders/export?${params.toString()}`, "_blank");
  }

  const columns: Column<Order>[] = [
    {
      header: () => (
        <Checkbox
          checked={orders.length > 0 && selectedIds.size === orders.length}
          onCheckedChange={toggleSelectAll}
          aria-label="Select all"
        />
      ),
      cell: (row) => (
        <Checkbox
          checked={selectedIds.has(row.id)}
          onCheckedChange={() => toggleSelect(row.id)}
          aria-label={`Select ${row.orderNumber}`}
        />
      ),
      className: "w-[40px]",
    },
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
            <SelectItem value="DRAFT">{t("statuses.DRAFT")}</SelectItem>
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

        <Select
          value={currentFulfillmentStatus ?? "all"}
          onValueChange={(v: string) =>
            updateParams("fulfillmentStatus", v === "all" ? undefined : v)
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t("fulfillment")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allFulfillments")}</SelectItem>
            <SelectItem value="UNFULFILLED">Unfulfilled</SelectItem>
            <SelectItem value="PARTIAL">Partial</SelectItem>
            <SelectItem value="FULFILLED">Fulfilled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date + Amount filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="date"
          placeholder={t("dateFrom")}
          defaultValue={currentDateFrom}
          className="w-[160px]"
          onChange={(e) => updateParams("dateFrom", e.target.value || undefined)}
        />
        <Input
          type="date"
          placeholder={t("dateTo")}
          defaultValue={currentDateTo}
          className="w-[160px]"
          onChange={(e) => updateParams("dateTo", e.target.value || undefined)}
        />
        <Input
          type="number"
          placeholder={t("amountMin")}
          defaultValue={currentAmountMin}
          className="w-[120px]"
          min={0}
          step={0.01}
          onChange={(e) => {
            const val = e.target.value;
            updateParams(
              "amountMin",
              val ? String(Math.round(Number(val) * 100)) : undefined,
            );
          }}
        />
        <Input
          type="number"
          placeholder={t("amountMax")}
          defaultValue={currentAmountMax}
          className="w-[120px]"
          min={0}
          step={0.01}
          onChange={(e) => {
            const val = e.target.value;
            updateParams(
              "amountMax",
              val ? String(Math.round(Number(val) * 100)) : undefined,
            );
          }}
        />
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          {t("exportCSV")}
        </Button>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bg-muted flex items-center gap-3 rounded-md p-3">
          <span className="text-sm font-medium">
            {t("selectedCount", { count: selectedIds.size })}
          </span>
          <Select onValueChange={handleBulkStatus} disabled={bulkUpdating}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("bulkChangeStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CONFIRMED">{t("statuses.CONFIRMED")}</SelectItem>
              <SelectItem value="PROCESSING">{t("statuses.PROCESSING")}</SelectItem>
              <SelectItem value="SHIPPED">{t("statuses.SHIPPED")}</SelectItem>
              <SelectItem value="DELIVERED">{t("statuses.DELIVERED")}</SelectItem>
              <SelectItem value="CANCELLED">{t("statuses.CANCELLED")}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            <X className="mr-1 h-4 w-4" />
            {t("clearSelection")}
          </Button>
        </div>
      )}

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
