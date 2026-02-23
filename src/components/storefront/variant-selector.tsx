"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils/format-price";
import type { ProductVariant } from "@/types";

type VariantSelectorProps = {
  variants: ProductVariant[];
  basePrice: number;
  onSelect: (variant: ProductVariant) => void;
  discount?: { type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING"; value: number } | null;
};

function applyDiscount(
  price: number,
  discount: NonNullable<VariantSelectorProps["discount"]>,
): number {
  switch (discount.type) {
    case "PERCENTAGE":
      return Math.round(price - (price * discount.value) / 10000);
    case "FIXED":
      return Math.max(0, price - discount.value);
    case "FREE_SHIPPING":
      return price;
  }
}

export function VariantSelector({
  variants,
  basePrice,
  onSelect,
  discount,
}: VariantSelectorProps) {
  const t = useTranslations("common");
  const [selectedId, setSelectedId] = useState<string | null>(variants[0]?.id ?? null);

  // Extract unique options
  const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];
  const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))];

  const [selectedSize, setSelectedSize] = useState<string | null>(sizes[0] ?? null);
  const [selectedColor, setSelectedColor] = useState<string | null>(colors[0] ?? null);

  function findVariant(size: string | null, color: string | null) {
    return variants.find(
      (v) => (size === null || v.size === size) && (color === null || v.color === color),
    );
  }

  function handleSizeChange(size: string) {
    setSelectedSize(size);
    const variant = findVariant(size, selectedColor);
    if (variant) {
      setSelectedId(variant.id);
      onSelect(variant);
    }
  }

  function handleColorChange(color: string) {
    setSelectedColor(color);
    const variant = findVariant(selectedSize, color);
    if (variant) {
      setSelectedId(variant.id);
      onSelect(variant);
    }
  }

  const selected = variants.find((v) => v.id === selectedId);
  const totalPrice = basePrice + (selected?.priceAdjustment ?? 0);
  const hasDiscount = discount && discount.type !== "FREE_SHIPPING";
  const discountedPrice = hasDiscount ? applyDiscount(totalPrice, discount) : totalPrice;

  return (
    <div className="space-y-4">
      {/* Size selector */}
      {sizes.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium">{t("size")}</label>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const variant = findVariant(size!, selectedColor);
              const inStock = variant ? variant.stock > 0 && variant.isAvailable : false;

              return (
                <Button
                  key={size}
                  variant={selectedSize === size ? "default" : "outline"}
                  size="sm"
                  disabled={!inStock}
                  onClick={() => handleSizeChange(size!)}
                  className={cn(!inStock && "line-through opacity-50")}
                >
                  {size}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color selector */}
      {colors.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium">{t("color")}</label>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const variant = findVariant(selectedSize, color!);
              const inStock = variant ? variant.stock > 0 && variant.isAvailable : false;

              return (
                <Button
                  key={color}
                  variant={selectedColor === color ? "default" : "outline"}
                  size="sm"
                  disabled={!inStock}
                  onClick={() => handleColorChange(color!)}
                  className={cn(!inStock && "line-through opacity-50")}
                >
                  {color}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Price display */}
      {selected && (
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{formatPrice(discountedPrice)}</span>
          {hasDiscount && discountedPrice < totalPrice && (
            <span className="text-muted-foreground text-lg line-through">
              {formatPrice(totalPrice)}
            </span>
          )}
          {selected.stock > 0 ? (
            <span className="text-sm text-green-600">
              {t("inStock", { count: selected.stock })}
            </span>
          ) : (
            <span className="text-destructive text-sm">{t("outOfStock")}</span>
          )}
        </div>
      )}
    </div>
  );
}
