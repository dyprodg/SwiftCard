"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateCoupon } from "@/server/actions/discounts";
import { useCartStore } from "@/stores/cart-store";

export function CouponInput() {
  const t = useTranslations("discount");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const couponCode = useCartStore((s) => s.couponCode);
  const appliedDiscount = useCartStore((s) => s.appliedDiscount);
  const setCoupon = useCartStore((s) => s.setCoupon);

  function handleApply() {
    if (!code.trim()) return;
    setError(null);

    startTransition(async () => {
      const result = await validateCoupon(code.trim());
      if (result.valid && result.discount) {
        setCoupon(code.trim().toUpperCase(), result.discount);
        setCode("");
      } else {
        setError(t(result.error ?? "invalidCode"));
      }
    });
  }

  function handleRemove() {
    setCoupon(null, null);
    setError(null);
  }

  if (couponCode && appliedDiscount) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-800">
              {t("applied")}: <code className="font-mono">{couponCode}</code>
            </p>
            <p className="text-xs text-green-600">{appliedDiscount.name}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRemove}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder={t("placeholder")}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApply())}
          className="flex-1"
        />
        <Button
          variant="outline"
          onClick={handleApply}
          disabled={isPending || !code.trim()}
        >
          {isPending ? t("applying") : t("apply")}
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
