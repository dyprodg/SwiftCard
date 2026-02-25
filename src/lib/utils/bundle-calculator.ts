/**
 * Calculate the total value of individual items in a bundle (without the bundle discount).
 */
export function calculateBundleItemsTotal(
  items: { unitPrice: number; quantity: number }[],
): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

/**
 * Calculate savings from buying a bundle vs individual items.
 */
export function calculateBundleSavings(
  bundlePrice: number,
  items: { unitPrice: number; quantity: number }[],
): { totalValue: number; savings: number; savingsPercent: number } {
  const totalValue = calculateBundleItemsTotal(items);
  const savings = Math.max(0, totalValue - bundlePrice);
  const savingsPercent = totalValue > 0 ? Math.round((savings / totalValue) * 100) : 0;
  return { totalValue, savings, savingsPercent };
}

/**
 * Proportionally allocate the bundle price across items.
 * Used when creating order line items to assign a fair price per item.
 */
export function allocateBundlePrice(
  bundlePrice: number,
  items: { id: string; unitPrice: number; quantity: number }[],
): { id: string; allocatedPrice: number }[] {
  const totalValue = calculateBundleItemsTotal(items);
  if (totalValue === 0) {
    return items.map((item) => ({ id: item.id, allocatedPrice: 0 }));
  }

  let allocated = 0;
  const result = items.map((item, index) => {
    const itemValue = item.unitPrice * item.quantity;
    const proportion = itemValue / totalValue;
    // Last item gets the remainder to avoid rounding errors
    const isLast = index === items.length - 1;
    const allocatedPrice = isLast
      ? bundlePrice - allocated
      : Math.round(bundlePrice * proportion);
    allocated += allocatedPrice;
    return { id: item.id, allocatedPrice };
  });

  return result;
}
