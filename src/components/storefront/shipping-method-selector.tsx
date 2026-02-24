"use client";

import { useTranslations } from "next-intl";
import { Truck } from "lucide-react";
import { formatPrice } from "@/lib/utils/format-price";
import type { ShippingOption } from "@/lib/utils/shipping-calculator";

type Props = {
  options: ShippingOption[];
  selected: string | null;
  onSelect: (id: string) => void;
  isLoading?: boolean;
};

export function ShippingMethodSelector({
  options,
  selected,
  onSelect,
  isLoading,
}: Props) {
  const t = useTranslations("checkout.shipping");

  if (isLoading) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("selectMethod")}</label>
        <div className="animate-pulse space-y-2">
          <div className="bg-muted h-14 rounded-md" />
          <div className="bg-muted h-14 rounded-md" />
        </div>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-center">
        <p className="text-muted-foreground text-sm">{t("noMethods")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t("selectMethod")}</label>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.id}
            className={`flex cursor-pointer items-center justify-between rounded-md border p-3 transition-colors ${
              selected === option.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="shippingMethod"
                value={option.id}
                checked={selected === option.id}
                onChange={() => onSelect(option.id)}
                className="accent-primary"
              />
              <Truck className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">{option.name}</span>
            </div>
            <div className="text-right">
              {option.price === 0 ? (
                <div>
                  <span className="text-sm font-medium text-green-600">{t("free")}</span>
                  {option.originalPrice !== undefined && (
                    <span className="text-muted-foreground ml-2 text-xs line-through">
                      {formatPrice(option.originalPrice)}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm font-medium">{formatPrice(option.price)}</span>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
