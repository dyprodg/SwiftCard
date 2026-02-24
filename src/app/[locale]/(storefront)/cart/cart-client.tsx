"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  useCartStore,
  selectTotalItems,
  selectSubtotal,
  selectDiscountAmount,
} from "@/stores/cart-store";
import { updateCartItem, removeFromCart } from "@/server/actions/cart";
import { formatPrice } from "@/lib/utils/format-price";
import { getItemDiscount } from "@/lib/utils/item-discount";
import { CouponInput } from "@/components/storefront/coupon-input";

export function CartPageClient() {
  const t = useTranslations("cart");
  const tc = useTranslations("common");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const items = useCartStore((s) => s.items);
  const setItems = useCartStore((s) => s.setItems);
  const totalItems = useCartStore(selectTotalItems);
  const subtotal = useCartStore(selectSubtotal);
  const appliedDiscount = useCartStore((s) => s.appliedDiscount);
  const discountAmount = useCartStore(selectDiscountAmount);

  // Restore cart from abandoned cart recovery link
  useEffect(() => {
    const restore = searchParams.get("restore");
    if (!restore) return;
    try {
      const restored = JSON.parse(Buffer.from(restore, "base64url").toString("utf-8"));
      if (Array.isArray(restored) && restored.length > 0) {
        setItems(restored);
      }
    } catch {
      // Invalid restore data — ignore
    }
    // Clean up URL
    window.history.replaceState({}, "", `/${locale}/cart`);
  }, [searchParams, locale, setItems]);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  async function handleUpdateQuantity(
    productId: string,
    variantId: string | null,
    quantity: number,
  ) {
    updateQuantity(productId, variantId, quantity);
    await updateCartItem(productId, variantId, quantity).catch(() => {});
  }

  async function handleRemove(productId: string, variantId: string | null) {
    removeItem(productId, variantId);
    await removeFromCart(productId, variantId).catch(() => {});
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16">
        <ShoppingCart className="text-muted-foreground h-24 w-24" />
        <p className="text-muted-foreground text-xl">{t("empty")}</p>
        <Button asChild>
          <Link href={`/${locale}/products`}>{t("continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Cart Items */}
      <div className="lg:col-span-2">
        <div className="space-y-4">
          {items.map((item) => {
            const { discountedPrice, hasDiscount } = getItemDiscount(
              item,
              appliedDiscount,
            );
            const lineTotal = item.unitPrice * item.quantity;
            const discountedLineTotal = discountedPrice * item.quantity;

            return (
              <div
                key={`${item.productId}:${item.variantId ?? "default"}`}
                className="flex gap-4 rounded-lg border p-4"
              >
                {/* Image */}
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div className="bg-muted flex h-full w-full items-center justify-center text-xs">
                      {tc("noImageShort")}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="font-medium">{item.productName}</h3>
                    {item.variantName && (
                      <p className="text-muted-foreground text-sm">{item.variantName}</p>
                    )}
                    {hasDiscount ? (
                      <div className="flex items-baseline gap-1.5 text-sm">
                        <span className="text-green-600">
                          {formatPrice(discountedPrice)}
                        </span>
                        <span className="text-muted-foreground line-through">
                          {formatPrice(item.unitPrice)}
                        </span>
                        <span>/ {t("items")}</span>
                      </div>
                    ) : (
                      <p className="text-sm">
                        {formatPrice(item.unitPrice)} / {t("items")}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          handleUpdateQuantity(
                            item.productId,
                            item.variantId,
                            item.quantity - 1,
                          )
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-10 text-center font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          handleUpdateQuantity(
                            item.productId,
                            item.variantId,
                            item.quantity + 1,
                          )
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive h-8 w-8"
                        onClick={() => handleRemove(item.productId, item.variantId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Line total */}
                    {hasDiscount ? (
                      <div className="flex items-baseline gap-1.5">
                        <p className="text-lg font-semibold text-green-600">
                          {formatPrice(discountedLineTotal)}
                        </p>
                        <p className="text-muted-foreground text-sm line-through">
                          {formatPrice(lineTotal)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-lg font-semibold">{formatPrice(lineTotal)}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <Button variant="outline" asChild>
            <Link href={`/${locale}/products`}>{t("continueShopping")}</Link>
          </Button>
        </div>
      </div>

      {/* Order Summary */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>{t("orderSummary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>
                {t("subtotal")} ({totalItems} {t("items")})
              </span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            {appliedDiscount && discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>
                  {t("discount")}
                  {appliedDiscount.code && ` (${appliedDiscount.code})`}
                </span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span>{t("shipping")}</span>
              <span className="text-muted-foreground">
                {appliedDiscount?.freeShipping
                  ? t("freeShipping")
                  : t("estimatedShipping")}
              </span>
            </div>

            <CouponInput />

            <Separator />

            <div className="flex justify-between font-semibold">
              <span>{t("total")}</span>
              <span className="text-lg">{formatPrice(subtotal - discountAmount)}</span>
            </div>

            <Button className="w-full" size="lg" asChild>
              <Link href={`/${locale}/checkout`}>{t("checkout")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
