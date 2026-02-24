"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { requestReturn } from "@/server/actions/returns";
import { returnReasonValues } from "@/lib/validations/return";

type OrderItem = {
  id: string;
  productName: string;
  variantName: string | null;
  quantity: number;
};

type Props = {
  orderId: string;
  items: OrderItem[];
  returnedQuantities: Record<string, number>;
};

export function ReturnRequestDialog({ orderId, items, returnedQuantities }: Props) {
  const t = useTranslations("returns");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [note, setNote] = useState("");
  const [selectedItems, setSelectedItems] = useState<
    Record<string, { checked: boolean; quantity: number }>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Filter to items that still have returnable quantity
  const returnableItems = items.filter((item) => {
    const returned = returnedQuantities[item.id] ?? 0;
    return item.quantity - returned > 0;
  });

  function toggleItem(itemId: string, maxQty: number) {
    setSelectedItems((prev) => {
      const current = prev[itemId];
      if (current?.checked) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: { checked: true, quantity: maxQty } };
    });
  }

  function updateQuantity(itemId: string, qty: number) {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity: qty },
    }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const itemsToReturn = Object.entries(selectedItems)
      .filter(([, v]) => v.checked)
      .map(([orderItemId, v]) => ({
        orderItemId,
        quantity: v.quantity,
      }));

    if (itemsToReturn.length === 0) {
      setError(t("selectItems"));
      setSubmitting(false);
      return;
    }

    if (!reason) {
      setError(t("selectReason"));
      setSubmitting(false);
      return;
    }

    const result = await requestReturn({
      orderId,
      reason: reason as (typeof returnReasonValues)[number],
      note: note || undefined,
      items: itemsToReturn,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setSubmitting(false);
  }

  if (success) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">{t("requestReturn")}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-green-600">{t("success")}</p>
          <DialogFooter>
            <Button
              onClick={() => {
                setOpen(false);
                window.location.reload();
              }}
            >
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{t("requestReturn")}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("requestReturnDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item selection */}
          <div>
            <Label className="mb-2 block text-sm font-medium">
              {t("selectItemsLabel")}
            </Label>
            <div className="space-y-3">
              {returnableItems.map((item) => {
                const returned = returnedQuantities[item.id] ?? 0;
                const maxQty = item.quantity - returned;
                const sel = selectedItems[item.id];

                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-md border p-3"
                  >
                    <Checkbox
                      checked={sel?.checked ?? false}
                      onCheckedChange={() => toggleItem(item.id, maxQty)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {item.productName}
                        {item.variantName && ` - ${item.variantName}`}
                      </p>
                      {sel?.checked && (
                        <div className="mt-2 flex items-center gap-2">
                          <Label className="text-xs">{t("quantity")}:</Label>
                          <Select
                            value={String(sel.quantity)}
                            onValueChange={(v) => updateQuantity(item.id, Number(v))}
                          >
                            <SelectTrigger className="h-8 w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: maxQty }, (_, i) => i + 1).map(
                                (n) => (
                                  <SelectItem key={n} value={String(n)}>
                                    {n}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                          <span className="text-muted-foreground text-xs">
                            / {maxQty}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reason */}
          <div>
            <Label className="mb-2 block text-sm font-medium">{t("reasonLabel")}</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectReason")} />
              </SelectTrigger>
              <SelectContent>
                {returnReasonValues.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`reasons.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Note */}
          <div>
            <Label className="mb-2 block text-sm font-medium">{t("addNote")}</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("notePlaceholder")}
              rows={3}
              maxLength={1000}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting ? t("submitting") : t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
