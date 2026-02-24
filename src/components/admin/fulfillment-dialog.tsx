"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { createFulfillment } from "@/server/actions/fulfillments";
import {
  CARRIER_VALUES,
  CARRIER_LABELS,
  buildTrackingUrl,
} from "@/lib/constants/carriers";
import type { OrderWithItemsAndRefundsAndFulfillments } from "@/types";

type FulfillmentDialogProps = {
  order: OrderWithItemsAndRefundsAndFulfillments;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ItemSelection = {
  selected: boolean;
  quantity: number;
  maxQuantity: number;
};

export function FulfillmentDialog({ order, open, onOpenChange }: FulfillmentDialogProps) {
  const t = useTranslations("admin.orders.fulfillment");

  const [carrier, setCarrier] = useState<string>("");
  const [carrierOther, setCarrierOther] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const buildItemSelections = useCallback(() => {
    const selections: Record<string, ItemSelection> = {};
    for (const item of order.items) {
      const alreadyFulfilled = order.fulfillments.reduce((sum, f) => {
        const fi = f.items.find((i) => i.orderItemId === item.id);
        return sum + (fi?.quantity ?? 0);
      }, 0);
      const maxQty = item.quantity - alreadyFulfilled;
      if (maxQty > 0) {
        selections[item.id] = { selected: true, quantity: maxQty, maxQuantity: maxQty };
      }
    }
    return selections;
  }, [order.items, order.fulfillments]);

  const [itemSelections, setItemSelections] =
    useState<Record<string, ItemSelection>>(buildItemSelections);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setItemSelections(buildItemSelections());
      setCarrier("");
      setCarrierOther("");
      setTrackingNumber("");
      setNote("");
      setError(null);
      setSuccess(false);
      setConfirming(false);
    }
  }, [open, buildItemSelections]);

  const trackingUrlPreview = buildTrackingUrl(carrier || null, trackingNumber || null);

  function toggleItem(itemId: string) {
    setItemSelections((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], selected: !prev[itemId].selected },
    }));
  }

  function setItemQuantity(itemId: string, qty: number) {
    setItemSelections((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantity: Math.min(Math.max(1, qty), prev[itemId].maxQuantity),
      },
    }));
  }

  function getSelectedItems() {
    const items: { orderItemId: string; quantity: number }[] = [];
    for (const item of order.items) {
      const sel = itemSelections[item.id];
      if (sel?.selected) {
        items.push({ orderItemId: item.id, quantity: sel.quantity });
      }
    }
    return items;
  }

  const hasSelectedItems = Object.values(itemSelections).some((s) => s.selected);

  async function handleConfirm() {
    setProcessing(true);
    setError(null);

    try {
      const items = getSelectedItems();
      const result = await createFulfillment({
        orderId: order.id,
        carrier: carrier ? (carrier as (typeof CARRIER_VALUES)[number]) : undefined,
        carrierOther: carrier === "OTHER" ? carrierOther : undefined,
        trackingNumber: trackingNumber || undefined,
        trackingUrl: "",
        note: note || undefined,
        items,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setProcessing(false);
      setConfirming(false);
    }
  }

  function handleClose() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="space-y-4 py-4">
            <div className="rounded-md bg-green-50 p-4 text-center text-sm text-green-700">
              {t("success")}
            </div>
            <Button onClick={handleClose} className="w-full">
              {t("close")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Item Selector */}
            <div>
              <Label className="mb-2 block">{t("selectItems")}</Label>
              <div className="space-y-3">
                {order.items.map((item) => {
                  const sel = itemSelections[item.id];
                  if (!sel) return null;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-md border p-3"
                    >
                      <Checkbox
                        checked={sel.selected}
                        onCheckedChange={() => toggleItem(item.id)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.productName}</p>
                        {item.variantName && (
                          <p className="text-muted-foreground text-xs">
                            {item.variantName}
                          </p>
                        )}
                      </div>
                      {sel.selected && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            max={sel.maxQuantity}
                            value={sel.quantity}
                            onChange={(e) =>
                              setItemQuantity(item.id, Number(e.target.value))
                            }
                            className="w-16 text-center"
                          />
                          <span className="text-muted-foreground text-xs">
                            / {sel.maxQuantity}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Carrier & Tracking */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("carrier")}</Label>
                <Select value={carrier} onValueChange={setCarrier}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectCarrier")} />
                  </SelectTrigger>
                  <SelectContent>
                    {CARRIER_VALUES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CARRIER_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {carrier === "OTHER" && (
                <div className="space-y-2">
                  <Label>{t("carrierName")}</Label>
                  <Input
                    value={carrierOther}
                    onChange={(e) => setCarrierOther(e.target.value)}
                    placeholder={t("carrierNamePlaceholder")}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>{t("trackingNumber")}</Label>
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder={t("trackingNumberPlaceholder")}
                />
              </div>

              {trackingUrlPreview && (
                <p className="text-muted-foreground truncate text-xs">
                  {t("trackingUrlPreview")}:{" "}
                  <a
                    href={trackingUrlPreview}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {trackingUrlPreview}
                  </a>
                </p>
              )}

              <div className="space-y-2">
                <Label>{t("note")}</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("notePlaceholder")}
                  rows={2}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            {/* Action buttons */}
            {confirming ? (
              <div className="space-y-3">
                <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
                  {t("confirmMessage")}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setConfirming(false)}
                    disabled={processing}
                    className="flex-1"
                  >
                    {t("back")}
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={processing}
                    className="flex-1"
                  >
                    {processing ? t("processing") : t("confirmFulfillment")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setConfirming(true)}
                disabled={!hasSelectedItems}
                className="w-full"
              >
                {t("createFulfillment")}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
