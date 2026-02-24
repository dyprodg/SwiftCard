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
    getRevenueTimeSeries(range),
    getSalesKPIs(range),
    getTopProducts(range),
    getRevenueByCategory(range),
    getRefundTimeSeries(range),
    getRefundReasons(range),
    getRefundKPIs(range),
    getDiscountPerformance(range),
    getCustomerBreakdown(range),
    getTopCustomers(range),
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
