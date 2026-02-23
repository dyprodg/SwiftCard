"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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

export function CartSheet({ locale }: { locale: string }) {
  const t = useTranslations("cart");
  const tc = useTranslations("common");
  const items = useCartStore((s) => s.items);
  const isOpen = useCartStore((s) => s.isOpen);
  const setOpen = useCartStore((s) => s.setOpen);
  const totalItems = useCartStore(selectTotalItems);
  const subtotal = useCartStore(selectSubtotal);
  const appliedDiscount = useCartStore((s) => s.appliedDiscount);
  const discountAmount = useCartStore(selectDiscountAmount);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  async function handleUpdateQuantity(
    productId: string,
    variantId: string | null,
    quantity: number,
  ) {
    // Optimistic update
    updateQuantity(productId, variantId, quantity);
    // Sync to KV
    await updateCartItem(productId, variantId, quantity).catch(() => {});
  }

  async function handleRemove(productId: string, variantId: string | null) {
    // Optimistic update
    removeItem(productId, variantId);
    // Sync to KV
    await removeFromCart(productId, variantId).catch(() => {});
  }

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold">
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          )}
          <span className="sr-only">{t("title")}</span>
        </Button>
      </SheetTrigger>

      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {t("title")} ({totalItems})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <ShoppingCart className="text-muted-foreground h-16 w-16" />
            <p className="text-muted-foreground text-lg">{t("empty")}</p>
            <Button variant="outline" onClick={() => setOpen(false)} asChild>
              <Link href={`/${locale}/products`}>{t("continueShopping")}</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Cart items */}
            <div className="flex-1 overflow-y-auto py-4">
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
                      className="flex gap-3"
                    >
                      {/* Image */}
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.productName}
                            fill
                            className="object-cover"
                            sizes="80px"
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
                          <p className="text-sm leading-tight font-medium">
                            {item.productName}
                          </p>
                          {item.variantName && (
                            <p className="text-muted-foreground text-xs">
                              {item.variantName}
                            </p>
                          )}
                          {hasDiscount ? (
                            <div className="flex items-baseline gap-1.5">
                              <p className="text-sm font-semibold text-green-600">
                                {formatPrice(discountedLineTotal)}
                              </p>
                              <p className="text-muted-foreground text-xs line-through">
                                {formatPrice(lineTotal)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm font-semibold">
                              {formatPrice(lineTotal)}
                            </p>
                          )}
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
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
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
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
                            className="text-destructive hover:text-destructive ml-auto h-7 w-7"
                            onClick={() => handleRemove(item.productId, item.variantId)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Footer */}
            <div className="space-y-3 pt-4">
              <div className="flex justify-between text-sm">
                <span>{t("subtotal")}</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
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

              <div className="grid gap-2">
                <Button asChild onClick={() => setOpen(false)}>
                  <Link href={`/${locale}/cart`}>{t("title")}</Link>
                </Button>
                <Button variant="default" asChild onClick={() => setOpen(false)}>
                  <Link href={`/${locale}/checkout`}>{t("checkout")}</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
