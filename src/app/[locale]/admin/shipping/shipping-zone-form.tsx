"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SHIPPING_COUNTRIES } from "@/lib/constants/countries";
import { createShippingZone, updateShippingZone } from "@/server/actions/shipping";
import type { ShippingZoneWithRates } from "@/types";

type RateRow = {
  id?: string;
  name: string;
  type: "FLAT" | "WEIGHT_BASED" | "PRICE_BASED";
  price: number;
  minValue: number | null;
  maxValue: number | null;
  freeAbove: number | null;
};

type Props = {
  zone?: ShippingZoneWithRates;
};

export function ShippingZoneForm({ zone }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("admin.shipping");
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(zone?.name ?? "");
  const [isDefault, setIsDefault] = useState(zone?.isDefault ?? false);
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(
    new Set(zone?.countries ?? []),
  );
  const [rates, setRates] = useState<RateRow[]>(
    zone?.rates.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      price: r.price,
      minValue: r.minValue,
      maxValue: r.maxValue,
      freeAbove: r.freeAbove,
    })) ?? [],
  );

  function toggleCountry(code: string) {
    setSelectedCountries((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function addRate() {
    setRates([
      ...rates,
      {
        name: "",
        type: "FLAT",
        price: 0,
        minValue: null,
        maxValue: null,
        freeAbove: null,
      },
    ]);
  }

  function removeRate(index: number) {
    setRates(rates.filter((_, i) => i !== index));
  }

  function updateRate(index: number, field: keyof RateRow, value: unknown) {
    setRates(rates.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data = {
      name,
      countries: [...selectedCountries],
      isDefault,
      rates: rates.map((r) => ({
        ...(r.id ? { id: r.id } : {}),
        name: r.name,
        type: r.type,
        price: r.price,
        minValue: r.minValue,
        maxValue: r.maxValue,
        freeAbove: r.freeAbove,
      })),
    };

    startTransition(async () => {
      try {
        if (zone) {
          await updateShippingZone(zone.id, data);
          toast.success(t("updated"));
        } else {
          await createShippingZone(data);
          toast.success(t("created"));
        }
        router.push(`/${locale}/admin/shipping`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("error"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Zone Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t("zoneInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">{t("zoneName")}</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("zoneNamePlaceholder")}
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            <label className="text-sm font-medium">{t("defaultZone")}</label>
            <span className="text-muted-foreground text-xs">{t("defaultZoneHint")}</span>
          </div>
        </CardContent>
      </Card>

      {/* Countries */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("countries")} ({selectedCountries.size})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {SHIPPING_COUNTRIES.map((country) => (
              <label
                key={country.code}
                className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm"
              >
                <Checkbox
                  checked={selectedCountries.has(country.code)}
                  onCheckedChange={() => toggleCountry(country.code)}
                />
                <span>{locale === "de" ? country.nameDe : country.name}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("rates")}</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addRate}>
            <Plus className="mr-1 h-4 w-4" />
            {t("addRate")}
          </Button>
        </CardHeader>
        <CardContent>
          {rates.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              {t("noRates")}
            </p>
          ) : (
            <div className="space-y-4">
              {rates.map((rate, index) => (
                <div key={index}>
                  {index > 0 && <Separator className="mb-4" />}
                  <div className="grid gap-3 sm:grid-cols-6">
                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium">{t("rateName")}</label>
                      <Input
                        value={rate.name}
                        onChange={(e) => updateRate(index, "name", e.target.value)}
                        placeholder={t("rateNamePlaceholder")}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t("rateType")}</label>
                      <Select
                        value={rate.type}
                        onValueChange={(v) => updateRate(index, "type", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FLAT">{t("typeFlat")}</SelectItem>
                          <SelectItem value="WEIGHT_BASED">{t("typeWeight")}</SelectItem>
                          <SelectItem value="PRICE_BASED">{t("typePrice")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t("ratePrice")}</label>
                      <Input
                        type="number"
                        min={0}
                        value={rate.price}
                        onChange={(e) =>
                          updateRate(index, "price", parseInt(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t("freeAbove")}</label>
                      <Input
                        type="number"
                        min={0}
                        value={rate.freeAbove ?? ""}
                        onChange={(e) =>
                          updateRate(
                            index,
                            "freeAbove",
                            e.target.value ? parseInt(e.target.value) : null,
                          )
                        }
                        placeholder={t("optional")}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRate(index)}
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {rate.type !== "FLAT" && (
                    <div className="mt-2 grid gap-3 sm:grid-cols-6">
                      <div className="sm:col-start-3">
                        <label className="text-muted-foreground text-xs">
                          {rate.type === "WEIGHT_BASED" ? t("minWeight") : t("minPrice")}
                        </label>
                        <Input
                          type="number"
                          min={0}
                          value={rate.minValue ?? ""}
                          onChange={(e) =>
                            updateRate(
                              index,
                              "minValue",
                              e.target.value ? parseInt(e.target.value) : null,
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="text-muted-foreground text-xs">
                          {rate.type === "WEIGHT_BASED" ? t("maxWeight") : t("maxPrice")}
                        </label>
                        <Input
                          type="number"
                          min={0}
                          value={rate.maxValue ?? ""}
                          onChange={(e) =>
                            updateRate(
                              index,
                              "maxValue",
                              e.target.value ? parseInt(e.target.value) : null,
                            )
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {zone ? t("updateZone") : t("createZone")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
