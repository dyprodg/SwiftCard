"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils/format-price";
import { validateGiftCardCode } from "@/server/actions/gift-cards";

export function BalanceChecker() {
  const t = useTranslations("giftCards");
  const [isPending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{
    valid: boolean;
    balance?: number;
    error?: string;
  } | null>(null);

  function handleCheck() {
    if (!code.trim()) return;
    startTransition(async () => {
      const res = await validateGiftCardCode(code);
      setResult(res);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t("placeholder")}
          className="font-mono"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleCheck();
            }
          }}
        />
        <Button onClick={handleCheck} disabled={isPending || !code.trim()}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("check")}
        </Button>
      </div>

      {result && (
        <Card>
          <CardContent className="pt-6">
            {result.valid ? (
              <div className="text-center">
                <p className="text-muted-foreground text-sm">{t("balance")}</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatPrice(result.balance!)}
                </p>
              </div>
            ) : (
              <p className="text-center text-red-600">{result.error}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
