"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { formatPrice } from "@/lib/utils/format-price";
import { processRefund } from "@/server/actions/refunds";
import { refundReasonValues, type RefundReason } from "@/lib/validations/refund";
import type { OrderWithItemsAndRefunds } from "@/types";

type RefundDialogProps = {
  order: OrderWithItemsAndRefunds;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ItemSelection = {
  selected: boolean;
  quantity: number;
  maxQuantity: number;
};

const stockDefaultsByReason: Record<string, boolean> = {
  CUSTOMER_REQUEST: true,
  DUPLICATE: true,
  DAMAGED: false,
  MISSING_ITEM: false,
  OTHER: false,
};

export function RefundDialog({ order, open, onOpenChange }: RefundDialogProps) {
  const t = useTranslations("admin.orders.refund");
  const remainingRefundable = order.total - order.totalRefunded;

  const [tab, setTab] = useState("full");
  const [reason, setReason] = useState<RefundReason>("CUSTOMER_REQUEST");
  const [note, setNote] = useState("");
  const [restoreStock, setRestoreStock] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [percentage, setPercentage] = useState(100);

  // Build item selection map with already-refunded quantities accounted for
  const buildItemSelections = useCallback(() => {
    const selections: Record<string, ItemSelection> = {};
    for (const item of order.items) {
      const alreadyRefunded = order.refunds.reduce((sum, r) => {
        const ri = r.items.find((i) => i.orderItemId === item.id);
        return sum + (ri?.quantity ?? 0);
      }, 0);
      const maxQty = item.quantity - alreadyRefunded;
      if (maxQty > 0) {
        selections[item.id] = { selected: false, quantity: maxQty, maxQuantity: maxQty };
      }
    }
    return selections;
  }, [order.items, order.refunds]);

  const [itemSelections, setItemSelections] =
    useState<Record<string, ItemSelection>>(buildItemSelections);

  function handleReasonChange(value: string) {
    const r = value as RefundReason;
    setReason(r);
    setRestoreStock(stockDefaultsByReason[r] ?? false);
  }

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

  function calculatePartialTotal() {
    let total = 0;
    for (const item of order.items) {
      const sel = itemSelections[item.id];
      if (sel?.selected) {
        total += Math.round(item.unitPrice * sel.quantity);
      }
    }
    return Math.min(total, remainingRefundable);
  }

  function calculatePercentageTotal() {
    let total = 0;
    for (const item of order.items) {
      const sel = itemSelections[item.id];
      if (sel?.selected) {
        total += Math.round((item.unitPrice * sel.quantity * percentage) / 100);
      }
    }
    return Math.min(total, remainingRefundable);
  }

  function getSelectedItems(usePercentage = false) {
    const pct = usePercentage ? percentage : 100;
    const items: { orderItemId: string; quantity: number; amount: number }[] = [];
    for (const item of order.items) {
      const sel = itemSelections[item.id];
      if (sel?.selected) {
        items.push({
          orderItemId: item.id,
          quantity: sel.quantity,
          amount: Math.round((item.unitPrice * sel.quantity * pct) / 100),
        });
      }
    }
    // Adjust last item for rounding
    if (items.length > 0 && usePercentage) {
      const computedTotal = items.reduce((sum, i) => sum + i.amount, 0);
      const expectedTotal = calculatePercentageTotal();
      const diff = expectedTotal - computedTotal;
      if (diff !== 0) {
        items[items.length - 1].amount += diff;
      }
    }
    return items;
  }

  async function handleConfirm() {
    setProcessing(true);
    setError(null);

    try {
      let result;
      if (tab === "full") {
        result = await processRefund({
          type: "full",
          orderId: order.id,
          reason,
          note: note || undefined,
          restoreStock,
        });
      } else if (tab === "partial") {
        const items = getSelectedItems(false);
        result = await processRefund({
          type: "partial",
          orderId: order.id,
          reason,
          note: note || undefined,
          restoreStock,
          items,
          totalAmount: calculatePartialTotal(),
        });
      } else {
        const items = getSelectedItems(true);
        result = await processRefund({
          type: "percentage",
          orderId: order.id,
          reason,
          note: note || undefined,
          restoreStock,
          items,
          percentage,
          totalAmount: calculatePercentageTotal(),
        });
      }

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
    if (success) {
      // Reset state on success close
      setSuccess(false);
      setConfirming(false);
      setError(null);
      setNote("");
      setItemSelections(buildItemSelections());
    }
    onOpenChange(false);
  }

  const hasSelectedItems =
    tab !== "full" && Object.values(itemSelections).some((s) => s.selected);

  const canSubmit =
    tab === "full" ||
    (hasSelectedItems &&
      (tab === "partial" ? calculatePartialTotal() > 0 : calculatePercentageTotal() > 0));

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
            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
              {t("refundableAmount")}:{" "}
              <strong>{formatPrice(remainingRefundable, order.currency)}</strong>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full">
                <TabsTrigger value="full" className="flex-1">
                  {t("fullRefund")}
                </TabsTrigger>
                <TabsTrigger value="partial" className="flex-1">
                  {t("itemRefund")}
                </TabsTrigger>
                <TabsTrigger value="percentage" className="flex-1">
                  {t("percentageRefund")}
                </TabsTrigger>
              </TabsList>

              {/* Full Refund Tab */}
              <TabsContent value="full" className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  {t("fullRefundDescription", {
                    amount: formatPrice(remainingRefundable, order.currency),
                  })}
                </p>
              </TabsContent>

              {/* Item Refund Tab */}
              <TabsContent value="partial" className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  {t("itemRefundDescription")}
                </p>
                <ItemSelector
                  order={order}
                  selections={itemSelections}
                  onToggle={toggleItem}
                  onQuantityChange={setItemQuantity}
                />
                {hasSelectedItems && (
                  <div className="flex justify-between rounded-md bg-gray-50 p-3 text-sm font-medium">
                    <span>{t("refundTotal")}</span>
                    <span>{formatPrice(calculatePartialTotal(), order.currency)}</span>
                  </div>
                )}
              </TabsContent>

              {/* Percentage Refund Tab */}
              <TabsContent value="percentage" className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  {t("percentageRefundDescription")}
                </p>
                <div className="space-y-2">
                  <Label>{t("percentage")}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={percentage}
                      onChange={(e) => setPercentage(Number(e.target.value) || 1)}
                      className="w-24"
                    />
                    <span className="text-muted-foreground text-sm">%</span>
                  </div>
                </div>
                <ItemSelector
                  order={order}
                  selections={itemSelections}
                  onToggle={toggleItem}
                  onQuantityChange={setItemQuantity}
                />
                {hasSelectedItems && (
                  <div className="flex justify-between rounded-md bg-gray-50 p-3 text-sm font-medium">
                    <span>
                      {t("refundTotal")} ({percentage}%)
                    </span>
                    <span>{formatPrice(calculatePercentageTotal(), order.currency)}</span>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <Separator />

            {/* Common fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("reason")}</Label>
                <Select value={reason} onValueChange={handleReasonChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {refundReasonValues.map((r) => (
                      <SelectItem key={r} value={r}>
                        {t(`reasons.${r}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("note")}</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("notePlaceholder")}
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="restoreStock"
                  checked={restoreStock}
                  onCheckedChange={(checked) => setRestoreStock(checked === true)}
                />
                <Label htmlFor="restoreStock" className="text-sm">
                  {t("restoreStock")}
                </Label>
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
                    variant="destructive"
                    onClick={handleConfirm}
                    disabled={processing}
                    className="flex-1"
                  >
                    {processing ? t("processing") : t("confirmRefund")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setConfirming(true)}
                disabled={!canSubmit}
                className="w-full"
              >
                {t("processRefund")}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ItemSelector({
  order,
  selections,
  onToggle,
  onQuantityChange,
}: {
  order: OrderWithItemsAndRefunds;
  selections: Record<string, ItemSelection>;
  onToggle: (itemId: string) => void;
  onQuantityChange: (itemId: string, qty: number) => void;
}) {
  return (
    <div className="space-y-3">
      {order.items.map((item) => {
        const sel = selections[item.id];
        if (!sel) return null; // fully refunded already
        return (
          <div key={item.id} className="flex items-center gap-3 rounded-md border p-3">
            <Checkbox checked={sel.selected} onCheckedChange={() => onToggle(item.id)} />
            <div className="flex-1">
              <p className="text-sm font-medium">{item.productName}</p>
              {item.variantName && (
                <p className="text-muted-foreground text-xs">{item.variantName}</p>
              )}
              <p className="text-muted-foreground text-xs">
                {formatPrice(item.unitPrice, order.currency)} each
              </p>
            </div>
            {sel.selected && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={sel.maxQuantity}
                  value={sel.quantity}
                  onChange={(e) => onQuantityChange(item.id, Number(e.target.value))}
                  className="w-16 text-center"
                />
                <span className="text-muted-foreground text-xs">/ {sel.maxQuantity}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
