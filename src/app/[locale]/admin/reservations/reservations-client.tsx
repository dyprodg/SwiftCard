"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Clock, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/admin/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ReservationRow = {
  id: string;
  variantId: string;
  quantity: number;
  sessionId: string;
  orderId: string | null;
  status: "RESERVED" | "CONVERTED" | "EXPIRED";
  expiresAt: Date;
  createdAt: Date;
  convertedAt: Date | null;
  expiredAt: Date | null;
  variantSku: string | null;
  variantSize: string | null;
  variantColor: string | null;
  orderNumber: string | null;
};

type Props = {
  reservations: ReservationRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  currentStatus?: string;
  stats: { activeCount: number; totalUnits: number };
};

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "RESERVED" ? "default" : status === "CONVERTED" ? "secondary" : "outline";

  return <Badge variant={variant}>{status}</Badge>;
}

export function ReservationsClient({
  reservations,
  total,
  page,
  pageSize,
  currentStatus,
  stats,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("admin.reservations");

  function updateParams(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  const columns: Column<ReservationRow>[] = [
    {
      header: t("variant"),
      cell: (row) => (
        <div>
          <p className="text-sm font-medium">
            {row.variantSku ?? row.variantId.slice(0, 8)}
          </p>
          {(row.variantSize || row.variantColor) && (
            <p className="text-muted-foreground text-xs">
              {[row.variantSize, row.variantColor].filter(Boolean).join(" / ")}
            </p>
          )}
        </div>
      ),
    },
    {
      header: t("quantity"),
      cell: (row) => <span className="font-mono">{row.quantity}</span>,
    },
    {
      header: t("session"),
      cell: (row) => (
        <span className="text-muted-foreground font-mono text-xs">
          {row.sessionId.slice(0, 12)}...
        </span>
      ),
    },
    {
      header: t("order"),
      cell: (row) =>
        row.orderId && row.orderNumber ? (
          <Link
            href={`/${locale}/admin/orders/${row.orderId}`}
            className="font-medium hover:underline"
          >
            {row.orderNumber}
          </Link>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      header: t("status"),
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: t("expiresAt"),
      cell: (row) => (
        <span className="text-sm">{new Date(row.expiresAt).toLocaleString()}</span>
      ),
    },
    {
      header: t("createdAt"),
      cell: (row) => (
        <span className="text-muted-foreground text-sm">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats card */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="bg-primary/10 rounded-lg p-3">
              <Clock className="text-primary h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.activeCount}</p>
              <p className="text-muted-foreground text-sm">{t("activeReservations")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="bg-primary/10 rounded-lg p-3">
              <Package className="text-primary h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalUnits}</p>
              <p className="text-muted-foreground text-sm">{t("unitsHeld")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select
          value={currentStatus ?? "all"}
          onValueChange={(v) => updateParams("status", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            <SelectItem value="RESERVED">{t("statusReserved")}</SelectItem>
            <SelectItem value="CONVERTED">{t("statusConverted")}</SelectItem>
            <SelectItem value="EXPIRED">{t("statusExpired")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={reservations}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
