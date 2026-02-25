import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  getSubscriptionPlans,
  getSubscriptions,
  getSubscriptionStats,
} from "@/server/queries/subscriptions";
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
import { formatPrice } from "@/lib/utils/format-price";
import { calculateSubscriptionPrice } from "@/lib/utils/subscription-price";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
};

const STATUS_VARIANT = {
  ACTIVE: "default",
  PAUSED: "secondary",
  PAST_DUE: "destructive",
  CANCELLED: "outline",
  EXPIRED: "outline",
} as const;

export default async function SubscriptionsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("admin.subscriptions");
  const tab = sp.tab ?? "plans";

  const [plans, { items: subs }, stats] = await Promise.all([
    getSubscriptionPlans(),
    getSubscriptions({ limit: 50 }),
    getSubscriptionStats(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("description")}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/admin/subscriptions/plans/new`}>{t("newPlan")}</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t("activeSubscriptions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t("mrr")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(stats.mrr)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t("totalPlans")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{plans.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t("pastDue")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.pastDue}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-2">
        <Button variant={tab === "plans" ? "default" : "outline"} size="sm" asChild>
          <Link href={`/${locale}/admin/subscriptions?tab=plans`}>{t("plans")}</Link>
        </Button>
        <Button
          variant={tab === "subscriptions" ? "default" : "outline"}
          size="sm"
          asChild
        >
          <Link href={`/${locale}/admin/subscriptions?tab=subscriptions`}>
            {t("subscriptionsList")}
          </Link>
        </Button>
      </div>

      {tab === "plans" ? (
        /* Plans Table */
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("planName")}</TableHead>
                <TableHead>{t("product")}</TableHead>
                <TableHead>{t("interval")}</TableHead>
                <TableHead>{t("discount")}</TableHead>
                <TableHead>{t("price")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    {t("noPlans")}
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => {
                  const price = calculateSubscriptionPrice(
                    plan.product.basePrice,
                    plan.variant?.priceAdjustment ?? 0,
                    plan.discountPercent,
                  );
                  return (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>{plan.product.name}</TableCell>
                      <TableCell>{t(plan.interval)}</TableCell>
                      <TableCell>
                        {plan.discountPercent > 0
                          ? `${(plan.discountPercent / 100).toFixed(0)}%`
                          : "—"}
                      </TableCell>
                      <TableCell>{formatPrice(price)}</TableCell>
                      <TableCell>
                        <Badge variant={plan.active ? "default" : "secondary"}>
                          {plan.active ? t("active") : t("inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/${locale}/admin/subscriptions/plans/${plan.id}`}>
                            {t("view")}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Subscriptions Table */
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("customerEmail")}</TableHead>
                <TableHead>{t("planName")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("currentPeriodEnd")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    {t("noSubscriptions")}
                  </TableCell>
                </TableRow>
              ) : (
                subs.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>{sub.customerEmail}</TableCell>
                    <TableCell>{sub.plan.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          STATUS_VARIANT[sub.status as keyof typeof STATUS_VARIANT]
                        }
                      >
                        {t(sub.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sub.currentPeriodEnd
                        ? sub.currentPeriodEnd.toLocaleDateString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
