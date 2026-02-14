"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
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
      header: "Order",
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
      header: "Customer",
      cell: (row) => (
        <div>
          <p className="text-sm font-medium">{row.shippingName}</p>
          <p className="text-muted-foreground text-xs">{row.customerEmail}</p>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (row) => <OrderStatusBadge status={row.status} />,
    },
    {
      header: "Payment",
      cell: (row) => <PaymentStatusBadge status={row.paymentStatus} />,
    },
    {
      header: "Total",
      cell: (row) => (
        <span className="font-medium">{formatPrice(row.total, row.currency)}</span>
      ),
      className: "text-right",
    },
    {
      header: "Date",
      cell: (row) => (
        <span className="text-muted-foreground text-sm">
          {new Date(row.createdAt).toLocaleDateString("de-CH")}
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
            placeholder="Search orders..."
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
          onValueChange={(v) => updateParams("status", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="SHIPPED">Shipped</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={currentPaymentStatus ?? "all"}
          onValueChange={(v) =>
            updateParams("paymentStatus", v === "all" ? undefined : v)
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={orders}
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
