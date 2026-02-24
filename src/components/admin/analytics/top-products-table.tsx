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
import type { TopProduct } from "@/server/queries/analytics";

export function TopProductsTable({ data }: { data: TopProduct[] }) {
  const t = useTranslations("admin.analytics");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tables.topProducts")}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noData")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t("tables.productName")}</TableHead>
                <TableHead className="text-right">{t("tables.unitsSold")}</TableHead>
                <TableHead className="text-right">{t("tables.revenue")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((product, i) => (
                <TableRow key={product.productId}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{product.productName}</TableCell>
                  <TableCell className="text-right">{product.unitsSold}</TableCell>
                  <TableCell className="text-right">
                    {formatPrice(product.revenue)}
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
