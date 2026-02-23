import Link from "next/link";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getDiscounts } from "@/server/queries/discounts";
import { formatPrice } from "@/lib/utils/format-price";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props = {
  searchParams: Promise<{ page?: string; status?: string }>;
  params: Promise<{ locale: string }>;
};

function formatDiscountValue(type: string, value: number): string {
  switch (type) {
    case "PERCENTAGE":
      return `${(value / 100).toFixed(value % 100 === 0 ? 0 : 2)}%`;
    case "FIXED":
      return formatPrice(value);
    case "FREE_SHIPPING":
      return "Free Shipping";
    default:
      return String(value);
  }
}

function getStatusBadge(
  discount: { active: boolean; expiresAt: Date | null },
  t: (key: string) => string,
) {
  const now = new Date();
  if (discount.expiresAt && discount.expiresAt < now) {
    return <Badge variant="outline">{t("expired")}</Badge>;
  }
  if (discount.active) {
    return <Badge variant="default">{t("active")}</Badge>;
  }
  return <Badge variant="secondary">{t("inactive")}</Badge>;
}

export default async function DiscountsPage({ searchParams, params }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("admin.discounts");
  const page = parseInt(sp.page ?? "1");
  const pageSize = 20;

  const { items, total } = await getDiscounts({
    status: sp.status as "active" | "inactive" | "expired" | undefined,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("totalCount", { count: total })}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/admin/discounts/new`}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addDiscount")}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button variant={!sp.status ? "default" : "outline"} size="sm" asChild>
          <Link href={`/${locale}/admin/discounts`}>{t("all")}</Link>
        </Button>
        {(["active", "inactive", "expired"] as const).map((status) => (
          <Button
            key={status}
            variant={sp.status === status ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/${locale}/admin/discounts?status=${status}`}>
              {t(status)}
            </Link>
          </Button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("code")}</TableHead>
              <TableHead>{t("typeCol")}</TableHead>
              <TableHead>{t("valueCol")}</TableHead>
              <TableHead>{t("usage")}</TableHead>
              <TableHead>{t("statusCol")}</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {t("noDiscounts")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((discount) => (
                <TableRow key={discount.id}>
                  <TableCell className="font-medium">
                    {discount.name}
                    {discount.automatic && (
                      <Badge variant="outline" className="ml-2">
                        {t("auto")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {discount.code ? (
                      <code className="bg-muted rounded px-1.5 py-0.5 text-sm">
                        {discount.code}
                      </code>
                    ) : (
                      <span className="text-muted-foreground">{"\u2014"}</span>
                    )}
                  </TableCell>
                  <TableCell>{t(`types.${discount.type}`)}</TableCell>
                  <TableCell>{formatDiscountValue(discount.type, discount.value)}</TableCell>
                  <TableCell>
                    {discount.usedCount}
                    {discount.maxUses ? ` / ${discount.maxUses}` : ""}
                  </TableCell>
                  <TableCell>{getStatusBadge(discount, t)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/${locale}/admin/discounts/${discount.id}/edit`}>
                        {t("editDiscount")}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {t("page")} {page} {t("of")} {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/${locale}/admin/discounts?page=${page - 1}${sp.status ? `&status=${sp.status}` : ""}`}
                >
                  {t("previous")}
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/${locale}/admin/discounts?page=${page + 1}${sp.status ? `&status=${sp.status}` : ""}`}
                >
                  {t("next")}
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
