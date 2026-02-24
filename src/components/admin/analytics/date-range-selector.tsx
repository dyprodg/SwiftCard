"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRESETS = [
  { key: "7d", days: 7 },
  { key: "30d", days: 30 },
  { key: "90d", days: 90 },
  { key: "1y", days: 365 },
  { key: "all", days: 0 },
] as const;

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function DateRangeSelector({
  dateFrom,
  dateTo,
}: {
  dateFrom: string;
  dateTo: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("admin.analytics");

  const updateRange = useCallback(
    (from: string, to: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("dateFrom", from);
      params.set("dateTo", to);
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handlePreset = (days: number) => {
    const to = new Date();
    if (days === 0) {
      // "All" — go back 3 years
      const from = new Date();
      from.setFullYear(from.getFullYear() - 3);
      updateRange(formatDate(from), formatDate(to));
    } else {
      const from = new Date();
      from.setDate(from.getDate() - days);
      updateRange(formatDate(from), formatDate(to));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => updateRange(e.target.value, dateTo)}
          className="w-auto"
        />
        <span className="text-muted-foreground text-sm">–</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => updateRange(dateFrom, e.target.value)}
          className="w-auto"
        />
      </div>
      <div className="flex gap-1">
        {PRESETS.map((preset) => (
          <Button
            key={preset.key}
            variant="outline"
            size="sm"
            onClick={() => handlePreset(preset.days)}
          >
            {t(`presets.${preset.key}`)}
          </Button>
        ))}
      </div>
    </div>
  );
}
