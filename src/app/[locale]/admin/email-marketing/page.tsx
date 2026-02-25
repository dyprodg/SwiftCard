import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getCampaigns, getCampaignStats } from "@/server/queries/newsletter";
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
  DRAFT: "secondary",
  SCHEDULED: "outline",
  SENDING: "default",
  SENT: "default",
  CANCELLED: "destructive",
} as const;

export default async function EmailMarketingPage({ searchParams, params }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("admin.emailMarketing");
  const page = parseInt(sp.page ?? "1");
  const pageSize = 20;

  const [{ items, total }, stats] = await Promise.all([
    getCampaigns({
      status: sp.status as
        | "DRAFT"
        | "SCHEDULED"
        | "SENDING"
        | "SENT"
        | "CANCELLED"
        | undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    getCampaignStats(),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${locale}/admin/email-marketing/subscribers`}>
              <Users className="mr-2 h-4 w-4" />
              {t("subscribers")}
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/${locale}/admin/email-marketing/new`}>
              <Plus className="mr-2 h-4 w-4" />
              {t("newCampaign")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t("totalCampaigns")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalCampaigns}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t("totalSent")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t("avgOpenRate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.avgOpenRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t("avgClickRate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.avgClickRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button variant={!sp.status ? "default" : "outline"} size="sm" asChild>
          <Link href={`/${locale}/admin/email-marketing`}>{t("filterAll")}</Link>
        </Button>
        {(["DRAFT", "SCHEDULED", "SENDING", "SENT", "CANCELLED"] as const).map(
          (status) => (
            <Button
              key={status}
              variant={sp.status === status ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href={`/${locale}/admin/email-marketing?status=${status}`}>
                {t(status)}
              </Link>
            </Button>
          ),
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("subject")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("segment")}</TableHead>
              <TableHead className="text-right">{t("sent")}</TableHead>
              <TableHead className="text-right">{t("opened")}</TableHead>
              <TableHead className="text-right">{t("clicked")}</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  {t("noResults")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {campaign.subject}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        STATUS_VARIANT[campaign.status as keyof typeof STATUS_VARIANT]
                      }
                    >
                      {t(
                        campaign.status as
                          | "DRAFT"
                          | "SCHEDULED"
                          | "SENDING"
                          | "SENT"
                          | "CANCELLED",
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {t(`segments.${campaign.segment}` as `segments.all_subscribers`)}
                  </TableCell>
                  <TableCell className="text-right">{campaign.totalSent}</TableCell>
                  <TableCell className="text-right">{campaign.totalOpened}</TableCell>
                  <TableCell className="text-right">{campaign.totalClicked}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/${locale}/admin/email-marketing/${campaign.id}`}>
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
                  href={`/${locale}/admin/email-marketing?page=${page - 1}${sp.status ? `&status=${sp.status}` : ""}`}
                >
                  {t("previous")}
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/${locale}/admin/email-marketing?page=${page + 1}${sp.status ? `&status=${sp.status}` : ""}`}
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
