import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus, Globe, Truck, Star, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAllShippingZones } from "@/server/queries/shipping";
import { SHIPPING_COUNTRIES } from "@/lib/constants/countries";
import { formatPrice } from "@/lib/utils/format-price";
import { ShippingZoneDeleteButton } from "./shipping-zone-delete-button";

export default async function ShippingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin.shipping");
  const zones = await getAllShippingZones();

  const countryMap = Object.fromEntries(
    SHIPPING_COUNTRIES.map((c) => [c.code, locale === "de" ? c.nameDe : c.name]),
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("description")}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/admin/shipping/new`}>
            <Plus className="mr-2 h-4 w-4" />
            {t("createZone")}
          </Link>
        </Button>
      </div>

      {zones.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Globe className="text-muted-foreground mb-3 h-10 w-10" />
            <p className="text-muted-foreground mb-4 text-sm">{t("empty")}</p>
            <Button asChild>
              <Link href={`/${locale}/admin/shipping/new`}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createZone")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {zones.map((zone) => (
            <Card key={zone.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{zone.name}</CardTitle>
                  {zone.isDefault && (
                    <Badge variant="secondary">
                      <Star className="mr-1 h-3 w-3" />
                      {t("default")}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/${locale}/admin/shipping/${zone.id}`}>
                      <Pencil className="mr-1 h-3 w-3" />
                      {t("edit")}
                    </Link>
                  </Button>
                  <ShippingZoneDeleteButton zoneId={zone.id} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex flex-wrap gap-1">
                  {zone.countries.map((code) => (
                    <Badge key={code} variant="outline" className="text-xs">
                      {countryMap[code] ?? code}
                    </Badge>
                  ))}
                </div>
                {zone.rates.length > 0 && (
                  <div className="bg-muted/50 rounded-md border p-3">
                    <div className="mb-2 flex items-center gap-1 text-xs font-medium">
                      <Truck className="h-3 w-3" />
                      {t("rates")} ({zone.rates.length})
                    </div>
                    <div className="space-y-1">
                      {zone.rates.map((rate) => (
                        <div
                          key={rate.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>{rate.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {rate.type.replace("_", " ")}
                            </Badge>
                            <span className="font-medium">{formatPrice(rate.price)}</span>
                            {rate.freeAbove && (
                              <span className="text-muted-foreground text-xs">
                                ({t("freeAbove")} {formatPrice(rate.freeAbove)})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
