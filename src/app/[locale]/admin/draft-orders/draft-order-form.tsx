"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Search, Plus, Minus, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils/format-price";
import { SHIPPING_COUNTRIES } from "@/lib/constants/countries";
import {
  searchProductsForDraft,
  createDraftOrder,
  updateDraftOrder,
  sendPaymentLink,
} from "@/server/actions/draft-orders";
import { SendPaymentLinkDialog } from "./send-payment-link-dialog";
import type { OrderWithItems, ProductWithRelations } from "@/types";

type DraftItem = {
  productId: string;
  variantId: string | null;
  quantity: number;
  productName: string;
  variantName: string | null;
  unitPrice: number;
  categoryId: string | null;
};

type Props = {
  existingOrder?: OrderWithItems;
};

export function DraftOrderForm({ existingOrder }: Props) {
  const locale = useLocale();
  const t = useTranslations("admin.draftOrders.form");
  const router = useRouter();

  // Product search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductWithRelations[]>([]);
  const [searching, setSearching] = useState(false);

  // Items state
  const [items, setItems] = useState<DraftItem[]>(
    existingOrder?.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      productName: item.productName,
      variantName: item.variantName,
      unitPrice: item.unitPrice,
      categoryId: null,
    })) ?? [],
  );

  // Customer info state
  const [customerEmail, setCustomerEmail] = useState(existingOrder?.customerEmail ?? "");
  const [shippingName, setShippingName] = useState(existingOrder?.shippingName ?? "");
  const [phone, setPhone] = useState(existingOrder?.phone ?? "");
  const [address1, setAddress1] = useState(existingOrder?.shippingAddress1 ?? "");
  const [address2, setAddress2] = useState(existingOrder?.shippingAddress2 ?? "");
  const [city, setCity] = useState(existingOrder?.shippingCity ?? "");
  const [zip, setZip] = useState(existingOrder?.shippingZip ?? "");
  const [country, setCountry] = useState(existingOrder?.shippingCountry ?? "CH");

  // Discount & notes
  const [couponCode, setCouponCode] = useState(existingOrder?.discountCode ?? "");
  const [internalNote, setInternalNote] = useState(existingOrder?.internalNote ?? "");

  // Form state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSendLink, setShowSendLink] = useState(false);
  const [savedOrderId, setSavedOrderId] = useState<string | null>(
    existingOrder?.id ?? null,
  );

  // Product search
  const handleSearch = useCallback(async () => {
    if (searchQuery.trim().length < 2) return;
    setSearching(true);
    try {
      const results = await searchProductsForDraft(searchQuery);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  function addItem(product: ProductWithRelations, variantId: string | null) {
    const variant = variantId ? product.variants.find((v) => v.id === variantId) : null;

    const unitPrice = product.basePrice + (variant?.priceAdjustment ?? 0);
    const variantName = variant
      ? [variant.color, variant.size, variant.material].filter(Boolean).join(" / ")
      : null;

    // Check if item already exists
    const existingIndex = items.findIndex(
      (i) => i.productId === product.id && i.variantId === variantId,
    );

    if (existingIndex >= 0) {
      setItems((prev) =>
        prev.map((item, i) =>
          i === existingIndex ? { ...item, quantity: item.quantity + 1 } : item,
        ),
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          productId: product.id,
          variantId,
          quantity: 1,
          productName: product.name,
          variantName,
          unitPrice,
          categoryId: product.categoryId,
        },
      ]);
    }

    setSearchResults([]);
    setSearchQuery("");
  }

  function updateQuantity(index: number, delta: number) {
    setItems((prev) =>
      prev
        .map((item, i) =>
          i === index ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  async function handleSave(andSendLink = false) {
    setError(null);
    setSaving(true);

    try {
      const payload = {
        items,
        customerEmail,
        shippingName,
        phone,
        shippingAddress1: address1,
        shippingAddress2: address2,
        shippingCity: city,
        shippingZip: zip,
        shippingCountry: country,
        couponCode: couponCode || undefined,
        internalNote,
      };

      if (existingOrder) {
        await updateDraftOrder({ orderId: existingOrder.id, ...payload });
        if (andSendLink) {
          setShowSendLink(true);
        } else {
          router.push(`/${locale}/admin/draft-orders`);
          router.refresh();
        }
      } else {
        const order = await createDraftOrder(payload);
        setSavedOrderId(order.id);
        if (andSendLink) {
          setShowSendLink(true);
        } else {
          router.push(`/${locale}/admin/draft-orders`);
          router.refresh();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft order");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left panel: Products + Items */}
        <div className="space-y-6 lg:col-span-2">
          {/* Product Search */}
          <Card className="p-4">
            <Label className="mb-2 block text-base font-semibold">{t("products")}</Label>
            <div className="flex gap-2">
              <Input
                placeholder={t("searchProducts")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button
                variant="outline"
                onClick={handleSearch}
                disabled={searching || searchQuery.trim().length < 2}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-md border p-2">
                {searchResults.map((product) => (
                  <div key={product.id} className="space-y-1">
                    {product.variants.length > 0 ? (
                      product.variants.map((variant) => (
                        <div
                          key={variant.id}
                          className="hover:bg-muted flex items-center justify-between rounded-md p-2"
                        >
                          <div>
                            <span className="text-sm font-medium">{product.name}</span>
                            <span className="text-muted-foreground ml-2 text-xs">
                              {[variant.color, variant.size, variant.material]
                                .filter(Boolean)
                                .join(" / ")}
                            </span>
                            <span className="text-muted-foreground ml-2 text-xs">
                              ({t("stock")}: {variant.stock})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {formatPrice(product.basePrice + variant.priceAdjustment)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addItem(product, variant.id)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="hover:bg-muted flex items-center justify-between rounded-md p-2">
                        <span className="text-sm font-medium">{product.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {formatPrice(product.basePrice)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addItem(product, null)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Line Items */}
          <Card className="p-4">
            <Label className="mb-2 block text-base font-semibold">{t("lineItems")}</Label>
            {items.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                {t("noItems")}
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={`${item.productId}-${item.variantId}`}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.productName}</div>
                      {item.variantName && (
                        <div className="text-muted-foreground text-xs">
                          {item.variantName}
                        </div>
                      )}
                      <div className="text-muted-foreground text-xs">
                        {formatPrice(item.unitPrice)} {t("each")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(index, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(index, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="w-20 text-right text-sm font-medium">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end border-t pt-3">
                  <div className="text-right">
                    <span className="text-muted-foreground text-sm">
                      {t("subtotal")}:{" "}
                    </span>
                    <span className="text-lg font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Internal Note */}
          <Card className="p-4">
            <Label className="mb-2 block text-base font-semibold">
              {t("internalNote")}
            </Label>
            <Textarea
              placeholder={t("internalNotePlaceholder")}
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              rows={3}
            />
          </Card>
        </div>

        {/* Right panel: Customer info + Discount + Summary */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="space-y-4 p-4">
            <Label className="block text-base font-semibold">{t("customerInfo")}</Label>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">{t("email")}</Label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                />
              </div>
              <div>
                <Label className="text-xs">{t("name")}</Label>
                <Input
                  value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">{t("phone")}</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
          </Card>

          {/* Shipping Address */}
          <Card className="space-y-4 p-4">
            <Label className="block text-base font-semibold">
              {t("shippingAddress")}
            </Label>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">{t("address1")}</Label>
                <Input value={address1} onChange={(e) => setAddress1(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">{t("address2")}</Label>
                <Input value={address2} onChange={(e) => setAddress2(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">{t("zip")}</Label>
                  <Input value={zip} onChange={(e) => setZip(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">{t("city")}</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-xs">{t("country")}</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIPPING_COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {locale === "de" ? c.nameDe : c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Discount */}
          <Card className="space-y-4 p-4">
            <Label className="block text-base font-semibold">{t("discount")}</Label>
            <Input
              placeholder={t("couponPlaceholder")}
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">{t("couponHint")}</p>
          </Card>

          {/* Actions */}
          <Card className="space-y-3 p-4">
            {error && <p className="text-destructive text-sm">{error}</p>}

            <Button
              className="w-full"
              onClick={() => handleSave(false)}
              disabled={saving || items.length === 0}
            >
              {saving ? t("saving") : existingOrder ? t("updateDraft") : t("saveDraft")}
            </Button>

            <Button
              className="w-full"
              variant="secondary"
              onClick={() => handleSave(true)}
              disabled={saving || items.length === 0 || !customerEmail}
            >
              <Send className="mr-2 h-4 w-4" />
              {existingOrder ? t("saveAndSendLink") : t("createAndSendLink")}
            </Button>
          </Card>
        </div>
      </div>

      {/* Send payment link dialog */}
      {showSendLink && savedOrderId && (
        <SendPaymentLinkDialog
          orderId={savedOrderId}
          open={showSendLink}
          onClose={() => {
            setShowSendLink(false);
            router.push(`/${locale}/admin/draft-orders`);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
