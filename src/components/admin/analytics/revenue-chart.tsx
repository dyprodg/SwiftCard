"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TimeSeriesPoint } from "@/server/queries/analytics";

export function RevenueChart({ data }: { data: TimeSeriesPoint[] }) {
  const t = useTranslations("admin.analytics");

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("charts.revenue")}</CardTitle>
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
        <CardTitle>{t("charts.revenue")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => formatDateLabel(v)}
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
                t("charts.revenue"),
              ]}
              labelFormatter={(label) => formatDateLabel(label)}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.1}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-CH", { month: "short", day: "numeric" });
}
