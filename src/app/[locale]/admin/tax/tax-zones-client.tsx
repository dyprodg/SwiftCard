"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, Star, Percent } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SHIPPING_COUNTRIES } from "@/lib/constants/countries";
import {
  createTaxZone,
  updateTaxZone,
  deleteTaxZone,
  seedDefaultTaxZones,
} from "@/server/actions/tax";
import type { TaxZone } from "@/types";

type Props = {
  initialZones: TaxZone[];
};

export function TaxZonesClient({ initialZones }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("admin.tax");
  const [isPending, startTransition] = useTransition();

  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState<TaxZone | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [taxInclusive, setTaxInclusive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set());

  const countryMap = Object.fromEntries(
    SHIPPING_COUNTRIES.map((c) => [c.code, locale === "de" ? c.nameDe : c.name]),
  );

  function openCreate() {
    setEditingZone(null);
    setName("");
    setTaxRate(0);
    setTaxInclusive(true);
    setIsDefault(false);
    setSelectedCountries(new Set());
    setShowForm(true);
  }

  function openEdit(zone: TaxZone) {
    setEditingZone(zone);
    setName(zone.name);
    setTaxRate(zone.taxRate);
    setTaxInclusive(zone.taxInclusive);
    setIsDefault(zone.isDefault);
    setSelectedCountries(new Set(zone.countries));
    setShowForm(true);
  }

  function toggleCountry(code: string) {
    setSelectedCountries((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      name,
      countries: [...selectedCountries],
      taxRate,
      taxInclusive,
      isDefault,
    };

    startTransition(async () => {
      try {
        if (editingZone) {
          await updateTaxZone(editingZone.id, data);
          toast.success(t("updated"));
        } else {
          await createTaxZone(data);
          toast.success(t("created"));
        }
        setShowForm(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("error"));
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm(t("deleteConfirm"))) return;
    startTransition(async () => {
      try {
        await deleteTaxZone(id);
        toast.success(t("deleted"));
        router.refresh();
      } catch {
        toast.error(t("error"));
      }
    });
  }

  return (
    <>
      <div className="mb-4">
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          {t("addZone")}
        </Button>
      </div>

      {initialZones.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Percent className="text-muted-foreground mb-3 h-10 w-10" />
            <p className="text-muted-foreground mb-4 text-sm">{t("empty")}</p>
            <div className="flex gap-2">
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t("addZone")}
              </Button>
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    try {
                      const result = await seedDefaultTaxZones();
                      toast.success(
                        t("seedSuccess").replace("{count}", String(result.created)),
                      );
                      router.refresh();
                    } catch {
                      toast.error(t("error"));
                    }
                  });
                }}
              >
                {t("seedDefaults")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {initialZones.map((zone) => (
            <Card key={zone.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{zone.name}</span>
                    <Badge variant="secondary">{(zone.taxRate * 100).toFixed(1)}%</Badge>
                    <Badge variant={zone.taxInclusive ? "default" : "outline"}>
                      {zone.taxInclusive ? t("inclusive") : t("exclusive")}
                    </Badge>
                    {zone.isDefault && (
                      <Badge variant="outline">
                        <Star className="mr-1 h-3 w-3" />
                        {t("default")}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {zone.countries.map((code) => (
                      <span key={code} className="text-muted-foreground text-xs">
                        {countryMap[code] ?? code}
                        {zone.countries.indexOf(code) < zone.countries.length - 1 && ", "}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(zone)}>
                    <Pencil className="mr-1 h-3 w-3" />
                    {t("edit")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={isPending}
                    onClick={() => handleDelete(zone.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingZone ? t("editZone") : t("addZone")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("zoneName")}</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("zoneNamePlaceholder")}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("taxRateLabel")}</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={taxRate * 100}
                  onChange={(e) => setTaxRate((parseFloat(e.target.value) || 0) / 100)}
                  className="w-32"
                />
                <span className="text-muted-foreground text-sm">%</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={taxInclusive} onCheckedChange={setTaxInclusive} />
              <div>
                <label className="text-sm font-medium">{t("taxInclusive")}</label>
                <p className="text-muted-foreground text-xs">{t("taxInclusiveHint")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
              <label className="text-sm font-medium">{t("defaultZone")}</label>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                {t("countries")} ({selectedCountries.size})
              </label>
              <div className="grid max-h-48 grid-cols-2 gap-1 overflow-y-auto">
                {SHIPPING_COUNTRIES.map((country) => (
                  <label
                    key={country.code}
                    className="flex cursor-pointer items-center gap-2 rounded p-1 text-sm"
                  >
                    <Checkbox
                      checked={selectedCountries.has(country.code)}
                      onCheckedChange={() => toggleCountry(country.code)}
                    />
                    {locale === "de" ? country.nameDe : country.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {editingZone ? t("updateZone") : t("addZone")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
