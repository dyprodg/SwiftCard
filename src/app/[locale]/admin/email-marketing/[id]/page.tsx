import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getCampaignById } from "@/server/queries/newsletter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CampaignActions } from "@/components/admin/campaign-actions";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

const STATUS_VARIANT = {
  DRAFT: "secondary",
  SCHEDULED: "outline",
  SENDING: "default",
  SENT: "default",
  CANCELLED: "destructive",
} as const;

export default async function CampaignDetailPage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations("admin.emailMarketing");
  const campaign = await getCampaignById(id);

  if (!campaign) notFound();

  const openRate =
    campaign.totalSent > 0
      ? Math.round((campaign.totalOpened / campaign.totalSent) * 100)
      : 0;
  const clickRate =
    campaign.totalSent > 0
      ? Math.round((campaign.totalClicked / campaign.totalSent) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
          <p className="text-muted-foreground">{campaign.subject}</p>
        </div>
        <CampaignActions campaign={campaign} />
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t("status")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={STATUS_VARIANT[campaign.status as keyof typeof STATUS_VARIANT]}
            >
              {t(campaign.status as "DRAFT")}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t("recipients")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{campaign.totalRecipients}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t("openRate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {openRate}%
              <span className="text-muted-foreground ml-2 text-sm font-normal">
                ({campaign.totalOpened}/{campaign.totalSent})
              </span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t("clickRate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {clickRate}%
              <span className="text-muted-foreground ml-2 text-sm font-normal">
                ({campaign.totalClicked}/{campaign.totalSent})
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Send History */}
      {campaign.sends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("sends")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("subscriberEmail")}</TableHead>
                  <TableHead>{t("sentAt")}</TableHead>
                  <TableHead>{t("opened")}</TableHead>
                  <TableHead>{t("clicked")}</TableHead>
                  <TableHead>{t("failed")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaign.sends.map((send) => (
                  <TableRow key={send.id}>
                    <TableCell>{send.email}</TableCell>
                    <TableCell>
                      {send.sentAt ? send.sentAt.toLocaleString() : "--"}
                    </TableCell>
                    <TableCell>
                      {send.openedAt ? send.openedAt.toLocaleString() : "--"}
                    </TableCell>
                    <TableCell>
                      {send.clickedAt ? send.clickedAt.toLocaleString() : "--"}
                    </TableCell>
                    <TableCell>
                      {send.failureReason ? (
                        <span className="text-red-600">{send.failureReason}</span>
                      ) : (
                        "--"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
