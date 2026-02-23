import type { AppliedDiscount } from "@/types";

type ItemForDiscount = {
  productId: string;
  categoryId: string | null;
  unitPrice: number;
};

/**
 * Calculate per-item discounted price.
 * Only PERCENTAGE discounts apply per-item; FIXED and FREE_SHIPPING are order-level only.
 */
export function getItemDiscount(
  item: ItemForDiscount,
  discount: AppliedDiscount | null,
): { discountedPrice: number; hasDiscount: boolean } {
  if (!discount || discount.type !== "PERCENTAGE") {
    return { discountedPrice: item.unitPrice, hasDiscount: false };
  }

  const isScoped = discount.productIds.length > 0 || discount.categoryIds.length > 0;

  if (isScoped) {
    const matchesProduct = discount.productIds.includes(item.productId);
    const matchesCategory =
      item.categoryId !== null && discount.categoryIds.includes(item.categoryId);
    if (!matchesProduct && !matchesCategory) {
      return { discountedPrice: item.unitPrice, hasDiscount: false };
    }
  }

  const discountedPrice = Math.round(
    item.unitPrice - (item.unitPrice * discount.value) / 10000,
  );

  return { discountedPrice, hasDiscount: true };
}
