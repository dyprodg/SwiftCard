"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils/format-price";
import { validateGiftCardCode } from "@/server/actions/gift-cards";

type Props = {
  onApply: (data: { code: string; id: string; balance: number }) => void;
  onRemove: () => void;
  applied: { code: string; balance: number } | null;
};

export function GiftCardInput({ onApply, onRemove, applied }: Props) {
  const t = useTranslations("giftCards");
  const [isPending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleApply() {
    if (!code.trim()) return;
    setError(null);

    startTransition(async () => {
      const result = await validateGiftCardCode(code);
      if (result.valid) {
        onApply({ code: result.code, id: result.id, balance: result.balance });
        setCode("");
      } else {
        setError(result.error);
      }
    });
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2 dark:border-green-900 dark:bg-green-950">
        <div>
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            {t("applied")}
          </p>
          <p className="text-muted-foreground text-xs">
            {t("balance")}: {formatPrice(applied.balance)}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t("placeholder")}
          className="font-mono"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleApply();
            }
          }}
        />
        <Button
          variant="outline"
          onClick={handleApply}
          disabled={isPending || !code.trim()}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("apply")}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
