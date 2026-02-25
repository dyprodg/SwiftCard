"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { addBundleToCart } from "@/server/actions/bundles";

type BundleItemInfo = {
  id: string;
  productId: string;
  variantId: string | null;
  productName: string;
  variants: { id: string; name: string; stock: number }[];
};

type Props = {
  bundleId: string;
  bundleItems: BundleItemInfo[];
  needsVariantSelection: boolean;
  disabled: boolean;
};

export function AddBundleToCartButton({
  bundleId,
  bundleItems,
  needsVariantSelection,
  disabled,
}: Props) {
  const t = useTranslations("bundles");
  const [isPending, startTransition] = useTransition();
  const [selections, setSelections] = useState<Record<string, string>>({});

  // Items that need variant selection
  const selectableItems = bundleItems.filter(
    (item) => !item.variantId && item.variants.length > 0,
  );

  const allSelected =
    !needsVariantSelection || selectableItems.every((item) => selections[item.id]);

  function handleAddToCart() {
    startTransition(async () => {
      const result = await addBundleToCart(bundleId, selections);
      if (result.success) {
        toast.success(t("addedToCart"));
      } else {
        toast.error(result.error ?? t("addError"));
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Variant selectors for items without pre-set variants */}
      {selectableItems.map((item) => (
        <div key={item.id} className="space-y-1">
          <Label className="text-sm">{item.productName}</Label>
          <Select
            value={selections[item.id] ?? ""}
            onValueChange={(val) =>
              setSelections((prev) => ({ ...prev, [item.id]: val }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("selectVariant")} />
            </SelectTrigger>
            <SelectContent>
              {item.variants
                .filter((v) => v.stock > 0)
                .map((variant) => (
                  <SelectItem key={variant.id} value={variant.id}>
                    {variant.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      ))}

      <Button
        size="lg"
        className="w-full"
        onClick={handleAddToCart}
        disabled={disabled || !allSelected || isPending}
      >
        {isPending ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <ShoppingCart className="mr-2 h-5 w-5" />
        )}
        {t("addToCart")}
      </Button>
    </div>
  );
}
