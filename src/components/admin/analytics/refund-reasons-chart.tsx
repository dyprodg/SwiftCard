"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RefundReason } from "@/server/queries/analytics";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#6366f1"];

export function RefundReasonsPieChart({ data }: { data: RefundReason[] }) {
  const t = useTranslations("admin.analytics");

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("charts.refundReasons")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t("noData")}</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: t(`refundReasons.${d.reason}`),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("charts.refundReasons")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ label, percent }) => `${label} (${(percent * 100).toFixed(0)}%)`}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
