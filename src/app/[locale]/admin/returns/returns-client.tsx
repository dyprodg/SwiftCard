"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ReturnData = {
  id: string;
  orderId: string;
  customerId: string;
  customerEmail: string;
  status: string;
  reason: string;
  createdAt: Date;
  items: { id: string; orderItemId: string; quantity: number }[];
  order: { orderNumber: string; customerEmail: string };
};

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  APPROVED: "bg-blue-100 text-blue-800 border-blue-200",
  RECEIVED: "bg-purple-100 text-purple-800 border-purple-200",
  REFUNDED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
};

export function ReturnsClient({
  returns,
  stats,
}: {
  returns: ReturnData[];
  stats: Record<string, number>;
}) {
  const locale = useLocale();
  const t = useTranslations("admin.returns");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const dateLocale = locale === "de" ? "de-CH" : "en-CH";

  const filtered =
    statusFilter === "all" ? returns : returns.filter((r) => r.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {(["REQUESTED", "APPROVED", "RECEIVED", "REFUNDED", "REJECTED"] as const).map(
          (status) => (
            <Card key={status} className="p-4">
              <p className="text-muted-foreground text-xs font-medium">
                {t(
                  `stats.${status.toLowerCase() as "requested" | "approved" | "received" | "refunded" | "rejected"}`,
                )}
              </p>
              <p className="text-2xl font-bold">{stats[status] ?? 0}</p>
            </Card>
          ),
        )}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("filterStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            {["REQUESTED", "APPROVED", "RECEIVED", "REFUNDED", "REJECTED"].map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <RotateCcw className="text-muted-foreground mb-4 h-12 w-12" />
          <p className="text-muted-foreground">{t("noReturns")}</p>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.order")}</TableHead>
                <TableHead>{t("table.customer")}</TableHead>
                <TableHead>{t("table.items")}</TableHead>
                <TableHead>{t("table.reason")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead>{t("table.date")}</TableHead>
                <TableHead>{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link
                      href={`/${locale}/admin/orders/${r.orderId}`}
                      className="text-primary hover:underline"
                    >
                      {r.order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{r.customerEmail}</TableCell>
                  <TableCell className="text-sm">
                    {r.items.reduce((sum, i) => sum + i.quantity, 0)} item(s)
                  </TableCell>
                  <TableCell className="text-sm">{r.reason}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_COLORS[r.status] ?? ""}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(r.createdAt).toLocaleDateString(dateLocale)}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/${locale}/admin/returns/${r.id}`}>
                        {t("table.view")}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
