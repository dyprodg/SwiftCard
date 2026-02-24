import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

export function StatCard({
  title,
  value,
  previousValue,
  format = "number",
}: {
  title: string;
  value: number;
  previousValue?: number;
  format?: "number" | "currency" | "percent";
}) {
  const formatted = formatValue(value, format);
  const delta = previousValue !== undefined ? computeDelta(value, previousValue) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatted}</div>
        {delta !== null && (
          <p
            className={cn(
              "mt-1 flex items-center gap-1 text-xs",
              delta > 0
                ? "text-green-600"
                : delta < 0
                  ? "text-red-600"
                  : "text-muted-foreground",
            )}
          >
            {delta > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : delta < 0 ? (
              <TrendingDown className="h-3 w-3" />
            ) : null}
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)}%
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function formatValue(value: number, format: "number" | "currency" | "percent") {
  switch (format) {
    case "currency":
      return new Intl.NumberFormat("de-CH", {
        style: "currency",
        currency: "CHF",
      }).format(value / 100);
    case "percent":
      return `${value.toFixed(1)}%`;
    default:
      return new Intl.NumberFormat("de-CH").format(value);
  }
}

function computeDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
