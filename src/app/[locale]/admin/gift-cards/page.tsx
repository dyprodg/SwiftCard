import Link from "next/link";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getGiftCards, getGiftCardStats } from "@/server/queries/gift-cards";
import { formatPrice } from "@/lib/utils/format-price";
import { maskGiftCardCode } from "@/lib/utils/gift-card-code";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const STATUS_VARIANT = {
  ACTIVE: "default",
  DISABLED: "destructive",
  FULLY_REDEEMED: "secondary",
  EXPIRED: "outline",
} as const;

export default async function GiftCardsPage({ searchParams, params }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("admin.giftCards");
  const page = parseInt(sp.page ?? "1");
  const pageSize = 20;

  const [{ items, total }, stats] = await Promise.all([
    getGiftCards({
      status: sp.status as
        | "ACTIVE"
        | "DISABLED"
        | "FULLY_REDEEMED"
        | "EXPIRED"
        | undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    getGiftCardStats(),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("totalCount", { count: total })}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/admin/gift-cards/new`}>
            <Plus className="mr-2 h-4 w-4" />
            {t("issue")}
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t("totalIssued")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalIssued}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t("totalActive")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalActive}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t("outstandingBalance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(stats.outstandingBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t("totalRedeemed")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(stats.totalRedeemed)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Filters */}
      <div className="flex items-center gap-2">
        <Button variant={!sp.status ? "default" : "outline"} size="sm" asChild>
          <Link href={`/${locale}/admin/gift-cards`}>{t("filterAll")}</Link>
        </Button>
        {(["ACTIVE", "DISABLED", "FULLY_REDEEMED", "EXPIRED"] as const).map((status) => (
          <Button
            key={status}
            variant={sp.status === status ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/${locale}/admin/gift-cards?status=${status}`}>{t(status)}</Link>
          </Button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("code")}</TableHead>
              <TableHead>{t("statusCol")}</TableHead>
              <TableHead>{t("recipient")}</TableHead>
              <TableHead className="text-right">{t("initialBalance")}</TableHead>
              <TableHead className="text-right">{t("currentBalance")}</TableHead>
              <TableHead>{t("issuedAt")}</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {t("noResults")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((card) => (
                <TableRow key={card.id}>
                  <TableCell className="font-mono text-sm">
                    {maskGiftCardCode(card.code)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={STATUS_VARIANT[card.status as keyof typeof STATUS_VARIANT]}
                    >
                      {t(card.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {card.recipientEmail || (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPrice(card.initialBalance)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPrice(card.currentBalance)}
                  </TableCell>
                  <TableCell>{card.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/${locale}/admin/gift-cards/${card.id}`}>
                        {t("view")}
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
                  href={`/${locale}/admin/gift-cards?page=${page - 1}${sp.status ? `&status=${sp.status}` : ""}`}
                >
                  {t("previous")}
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/${locale}/admin/gift-cards?page=${page + 1}${sp.status ? `&status=${sp.status}` : ""}`}
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
