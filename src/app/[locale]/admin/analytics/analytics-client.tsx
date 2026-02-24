"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangeSelector } from "@/components/admin/analytics/date-range-selector";
import { StatCard } from "@/components/admin/analytics/stat-card";
import { RevenueChart } from "@/components/admin/analytics/revenue-chart";
import { OrdersChart } from "@/components/admin/analytics/orders-chart";
import { CategoryPieChart } from "@/components/admin/analytics/category-pie-chart";
import { RefundReasonsPieChart } from "@/components/admin/analytics/refund-reasons-chart";
import { TopProductsTable } from "@/components/admin/analytics/top-products-table";
import { TopCustomersTable } from "@/components/admin/analytics/top-customers-table";
import { useRouter, useSearchParams } from "next/navigation";
import { formatPrice } from "@/lib/utils/format-price";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  TimeSeriesPoint,
  SalesKPIs,
  TopProduct,
  CategoryRevenue,
  RefundTimeSeriesPoint,
  RefundReason,
  RefundKPIs,
  DiscountPerformance,
  CustomerBreakdown,
  TopCustomer,
} from "@/server/queries/analytics";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AnalyticsData = {
  revenueTimeSeries: TimeSeriesPoint[];
  salesKPIs: SalesKPIs;
  topProducts: TopProduct[];
  categoryRevenue: CategoryRevenue[];
  refundTimeSeries: RefundTimeSeriesPoint[];
  refundReasons: RefundReason[];
  refundKPIs: RefundKPIs;
  discountPerformance: DiscountPerformance[];
  customerBreakdown: CustomerBreakdown;
  topCustomers: TopCustomer[];
};

export function AnalyticsClient({
  data,
  dateFrom,
  dateTo,
  currentTab,
}: {
  data: AnalyticsData;
  dateFrom: string;
  dateTo: string;
  currentTab: string;
}) {
  const t = useTranslations("admin.analytics");
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <DateRangeSelector dateFrom={dateFrom} dateTo={dateTo} />

      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
          <TabsTrigger value="products">{t("tabs.products")}</TabsTrigger>
          <TabsTrigger value="refunds">{t("tabs.refunds")}</TabsTrigger>
          <TabsTrigger value="discounts">{t("tabs.discounts")}</TabsTrigger>
          <TabsTrigger value="customers">{t("tabs.customers")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab data={data} />
        </TabsContent>

        <TabsContent value="products">
          <ProductsTab data={data} />
        </TabsContent>

        <TabsContent value="refunds">
          <RefundsTab data={data} />
        </TabsContent>

        <TabsContent value="discounts">
          <DiscountsTab data={data} />
        </TabsContent>

        <TabsContent value="customers">
          <CustomersTab data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab({ data }: { data: AnalyticsData }) {
  const t = useTranslations("admin.analytics");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("kpis.revenue")}
          value={data.salesKPIs.revenue}
          previousValue={data.salesKPIs.previousRevenue}
          format="currency"
        />
        <StatCard
          title={t("kpis.orders")}
          value={data.salesKPIs.orderCount}
          previousValue={data.salesKPIs.previousOrderCount}
        />
        <StatCard
          title={t("kpis.avgOrderValue")}
          value={data.salesKPIs.avgOrderValue}
          previousValue={data.salesKPIs.previousAvgOrderValue}
          format="currency"
        />
        <StatCard
          title={t("kpis.refundRate")}
          value={data.salesKPIs.refundRate}
          previousValue={data.salesKPIs.previousRefundRate}
          format="percent"
        />
      </div>

      <RevenueChart data={data.revenueTimeSeries} />
      <OrdersChart data={data.revenueTimeSeries} />
    </div>
  );
}

function ProductsTab({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-6">
      <TopProductsTable data={data.topProducts} />
      <CategoryPieChart data={data.categoryRevenue} />
    </div>
  );
}

function RefundsTab({ data }: { data: AnalyticsData }) {
  const t = useTranslations("admin.analytics");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title={t("kpis.totalRefunded")}
          value={data.refundKPIs.totalRefunded}
          format="currency"
        />
        <StatCard title={t("kpis.refundCount")} value={data.refundKPIs.refundCount} />
        <StatCard
          title={t("kpis.refundRate")}
          value={data.refundKPIs.refundRate}
          format="percent"
        />
      </div>

      <RefundAmountChart data={data.refundTimeSeries} />
      <RefundReasonsPieChart data={data.refundReasons} />
    </div>
  );
}

function RefundAmountChart({ data }: { data: RefundTimeSeriesPoint[] }) {
  const t = useTranslations("admin.analytics");

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("charts.refundAmount")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t("noData")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("charts.refundAmount")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => {
                const d = new Date(v);
                return d.toLocaleDateString("de-CH", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `${(v / 100).toFixed(0)}`}
            />
            <Tooltip
              formatter={(value: number) => [
                new Intl.NumberFormat("de-CH", {
                  style: "currency",
                  currency: "CHF",
                }).format(value / 100),
                t("charts.refundAmount"),
              ]}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.1}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function DiscountsTab({ data }: { data: AnalyticsData }) {
  const t = useTranslations("admin.analytics");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tables.discountPerformance")}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.discountPerformance.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noData")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tables.discountCode")}</TableHead>
                <TableHead>{t("tables.discountName")}</TableHead>
                <TableHead>{t("tables.discountType")}</TableHead>
                <TableHead className="text-right">{t("tables.timesUsed")}</TableHead>
                <TableHead className="text-right">{t("tables.totalGiven")}</TableHead>
                <TableHead className="text-right">
                  {t("tables.revenueGenerated")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.discountPerformance.map((d) => (
                <TableRow key={d.discountId}>
                  <TableCell className="font-mono text-sm">{d.code || "—"}</TableCell>
                  <TableCell>{d.name}</TableCell>
                  <TableCell>{d.type}</TableCell>
                  <TableCell className="text-right">{d.timesUsed}</TableCell>
                  <TableCell className="text-right">
                    {formatPrice(d.totalGiven)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPrice(d.revenueGenerated)}
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

function CustomersTab({ data }: { data: AnalyticsData }) {
  const t = useTranslations("admin.analytics");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          title={t("kpis.newCustomers")}
          value={data.customerBreakdown.newCustomers}
        />
        <StatCard
          title={t("kpis.returningCustomers")}
          value={data.customerBreakdown.returningCustomers}
        />
      </div>

      <TopCustomersTable data={data.topCustomers} />
    </div>
  );
}
