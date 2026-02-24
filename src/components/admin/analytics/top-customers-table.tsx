"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/utils/format-price";
import type { TopCustomer } from "@/server/queries/analytics";

export function TopCustomersTable({ data }: { data: TopCustomer[] }) {
  const t = useTranslations("admin.analytics");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tables.topCustomers")}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noData")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t("tables.customerEmail")}</TableHead>
                <TableHead className="text-right">{t("tables.orderCount")}</TableHead>
                <TableHead className="text-right">{t("tables.totalSpent")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((customer, i) => (
                <TableRow key={customer.customerEmail}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{customer.customerEmail}</TableCell>
                  <TableCell className="text-right">{customer.orderCount}</TableCell>
                  <TableCell className="text-right">
                    {formatPrice(customer.totalSpent)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
