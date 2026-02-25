import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { getSubscribers, getSubscriberStats } from "@/server/queries/newsletter";
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
import { SubscriberActions } from "@/components/admin/subscriber-actions";

type Props = {
  searchParams: Promise<{ page?: string; status?: string }>;
  params: Promise<{ locale: string }>;
};

const STATUS_VARIANT = {
  PENDING: "outline",
  ACTIVE: "default",
  UNSUBSCRIBED: "secondary",
} as const;

export default async function SubscribersPage({ searchParams, params }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("admin.emailMarketing");
  const page = parseInt(sp.page ?? "1");
  const pageSize = 20;

  const [{ items, total }, stats] = await Promise.all([
    getSubscribers({
      status: sp.status as "PENDING" | "ACTIVE" | "UNSUBSCRIBED" | undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    getSubscriberStats(),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("subscribers")}</h1>
        </div>
        <div className="flex gap-2">
          <SubscriberActions />
          <Button variant="outline" asChild>
            <Link href={`/${locale}/admin/email-marketing`}>{t("campaigns")}</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t("totalSubscribers")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t("ACTIVE")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t("PENDING")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t("UNSUBSCRIBED")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.unsubscribed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button variant={!sp.status ? "default" : "outline"} size="sm" asChild>
          <Link href={`/${locale}/admin/email-marketing/subscribers`}>
            {t("filterAll")}
          </Link>
        </Button>
        {(["ACTIVE", "PENDING", "UNSUBSCRIBED"] as const).map((status) => (
          <Button
            key={status}
            variant={sp.status === status ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/${locale}/admin/email-marketing/subscribers?status=${status}`}>
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
              <TableHead>{t("subscriberEmail")}</TableHead>
              <TableHead>{t("subscriberStatus")}</TableHead>
              <TableHead>{t("subscriberSource")}</TableHead>
              <TableHead>{t("subscribedAt")}</TableHead>
              <TableHead>{t("confirmedAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {t("noSubscribers")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>{sub.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={STATUS_VARIANT[sub.status as keyof typeof STATUS_VARIANT]}
                    >
                      {t(sub.status as "PENDING" | "ACTIVE" | "UNSUBSCRIBED")}
                    </Badge>
                  </TableCell>
                  <TableCell>{sub.source}</TableCell>
                  <TableCell>{sub.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell>
                    {sub.confirmedAt ? sub.confirmedAt.toLocaleDateString() : "--"}
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
                  href={`/${locale}/admin/email-marketing/subscribers?page=${page - 1}${sp.status ? `&status=${sp.status}` : ""}`}
                >
                  {t("previous")}
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/${locale}/admin/email-marketing/subscribers?page=${page + 1}${sp.status ? `&status=${sp.status}` : ""}`}
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
