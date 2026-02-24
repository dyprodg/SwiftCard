import { getTranslations } from "next-intl/server";
import {
  getRevenueTimeSeries,
  getSalesKPIs,
  getTopProducts,
  getRevenueByCategory,
  getRefundTimeSeries,
  getRefundReasons,
  getRefundKPIs,
  getDiscountPerformance,
  getCustomerBreakdown,
  getTopCustomers,
} from "@/server/queries/analytics";
import { AnalyticsClient } from "./analytics-client";

type Props = {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    tab?: string;
  }>;
};

function defaultDateFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultDateTo() {
  return new Date().toISOString().slice(0, 10);
}

export default async function AdminAnalyticsPage({ searchParams }: Props) {
  const params = await searchParams;
  const t = await getTranslations("admin.analytics");

  const dateFrom = params.dateFrom || defaultDateFrom();
  const dateTo = params.dateTo || defaultDateTo();
  const currentTab = params.tab || "overview";
  const range = { dateFrom, dateTo };

  async function safeQuery<T>(
    name: string,
    fn: () => Promise<T>,
    fallback: T,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      console.error(`Analytics query "${name}" failed:`, error);
      return fallback;
    }
  }

  const emptyKPIs: Awaited<ReturnType<typeof getSalesKPIs>> = {
    revenue: 0,
    orderCount: 0,
    avgOrderValue: 0,
    refundRate: 0,
    previousRevenue: 0,
    previousOrderCount: 0,
    previousAvgOrderValue: 0,
    previousRefundRate: 0,
  };

  const emptyRefundKPIs: Awaited<ReturnType<typeof getRefundKPIs>> = {
    totalRefunded: 0,
    refundCount: 0,
    avgRefundAmount: 0,
    refundRate: 0,
    previousTotalRefunded: 0,
    previousRefundCount: 0,
    previousAvgRefundAmount: 0,
    previousRefundRate: 0,
  };

  const [
    revenueTimeSeries,
    salesKPIs,
    topProducts,
    categoryRevenue,
    refundTimeSeries,
    refundReasons,
    refundKPIs,
    discountPerformance,
    customerBreakdown,
    topCustomers,
  ] = await Promise.all([
    safeQuery("revenueTimeSeries", () => getRevenueTimeSeries(range), []),
    safeQuery("salesKPIs", () => getSalesKPIs(range), emptyKPIs),
    safeQuery("topProducts", () => getTopProducts(range), []),
    safeQuery("categoryRevenue", () => getRevenueByCategory(range), []),
    safeQuery("refundTimeSeries", () => getRefundTimeSeries(range), []),
    safeQuery("refundReasons", () => getRefundReasons(range), []),
    safeQuery("refundKPIs", () => getRefundKPIs(range), emptyRefundKPIs),
    safeQuery("discountPerformance", () => getDiscountPerformance(range), []),
    safeQuery("customerBreakdown", () => getCustomerBreakdown(range), {
      newCustomers: 0,
      returningCustomers: 0,
    }),
    safeQuery("topCustomers", () => getTopCustomers(range), []),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>

      <AnalyticsClient
        data={{
          revenueTimeSeries,
          salesKPIs,
          topProducts,
          categoryRevenue,
          refundTimeSeries,
          refundReasons,
          refundKPIs,
          discountPerformance,
          customerBreakdown,
          topCustomers,
        }}
        dateFrom={dateFrom}
        dateTo={dateTo}
        currentTab={currentTab}
      />
    </div>
  );
}
