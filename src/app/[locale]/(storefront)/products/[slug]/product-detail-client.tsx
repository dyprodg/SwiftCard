"use client";

import { useState, useTransition } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { VariantSelector } from "@/components/storefront/variant-selector";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { addToCart } from "@/server/actions/cart";
import { formatPrice } from "@/lib/utils/format-price";
import type { ProductVariant } from "@/types";

type Props = {
  productId: string;
  productName: string;
  variants: ProductVariant[];
  basePrice: number;
  imageUrl: string | null;
};

export function ProductDetailClient({
  productId,
  productName,
  variants,
  basePrice,
  imageUrl,
}: Props) {
  const t = useTranslations("products");
  const tc = useTranslations("common");
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants[0] ?? null,
  );
  const [isPending, startTransition] = useTransition();
  const [justAdded, setJustAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const setOpen = useCartStore((s) => s.setOpen);

  const unitPrice = basePrice + (selectedVariant?.priceAdjustment ?? 0);
  const variantName = selectedVariant
    ? [selectedVariant.size, selectedVariant.color, selectedVariant.material]
        .filter(Boolean)
        .join(" / ") || null
    : null;
  const isInStock = selectedVariant
    ? selectedVariant.stock > 0 && selectedVariant.isAvailable
    : true; // no variants = always in stock for now

  function handleAddToCart() {
    // Optimistic: add to local store
    addItem({
      productId,
      variantId: selectedVariant?.id ?? null,
      quantity: 1,
      productName,
      variantName,
      unitPrice,
      imageUrl,
    });

    // Visual feedback
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);

    // Open cart sheet
    setOpen(true);

    // Sync to KV in background
    startTransition(async () => {
      const result = await addToCart(productId, selectedVariant?.id ?? null, 1);
      if (!result.success) {
        toast.error(result.error ?? tc("failedToAdd"));
      } else {
        toast.success(t("addedToCart"));
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Variant Selector */}
      {variants.length > 0 && (
        <VariantSelector
          variants={variants}
          basePrice={basePrice}
          onSelect={(variant) => setSelectedVariant(variant)}
        />
      )}

      {/* Price (shown when no variants) */}
      {variants.length === 0 && (
        <p className="text-2xl font-bold">{formatPrice(basePrice)}</p>
      )}

      {/* Add to Cart */}
      <Button
        size="lg"
        className="w-full"
        disabled={!isInStock || isPending}
        onClick={handleAddToCart}
      >
        {justAdded ? (
          <>
            <Check className="mr-2 h-5 w-5" />
            {t("addedToCart")}
          </>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-5 w-5" />
            {t("addToCart")}
          </>
        )}
      </Button>
    </div>
  );
}
