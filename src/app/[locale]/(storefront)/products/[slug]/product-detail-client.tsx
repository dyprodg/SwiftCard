"use client";

import { VariantSelector } from "@/components/storefront/variant-selector";
import type { ProductVariant } from "@/types";

type Props = {
  variants: ProductVariant[];
  basePrice: number;
};

export function ProductDetailClient({ variants, basePrice }: Props) {
  return (
    <VariantSelector
      variants={variants}
      basePrice={basePrice}
      onSelect={() => {
        // Cart integration in Phase 3
      }}
    />
  );
}
