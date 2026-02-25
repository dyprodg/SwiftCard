"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { adjustGiftCardBalance, disableGiftCard } from "@/server/actions/gift-cards";
import type { GiftCard } from "@/types";

export function GiftCardActions({ card }: { card: GiftCard }) {
  const t = useTranslations("admin.giftCards");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");

  function handleAdjust() {
    if (!amount || !note) return;
    startTransition(async () => {
      try {
        await adjustGiftCardBalance({
          giftCardId: card.id,
          amount,
          note,
        });
        toast.success(t("balanceAdjusted"));
        setAdjustOpen(false);
        setAmount(0);
        setNote("");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("error"));
      }
    });
  }

  function handleDisable() {
    startTransition(async () => {
      try {
        await disableGiftCard(card.id);
        toast.success(t("disabled"));
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("error"));
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            {t("adjustBalance")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("adjustBalance")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("adjustAmount")}</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder={t("adjustAmountPlaceholder")}
              />
            </div>
            <div>
              <Label>{t("note")}</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("notePlaceholder")}
              />
            </div>
            <Button onClick={handleAdjust} disabled={isPending || !amount || !note}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {card.status === "ACTIVE" && (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDisable}
          disabled={isPending}
        >
          {t("disable")}
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(`/${locale}/admin/gift-cards`)}
      >
        {t("backToList")}
      </Button>
    </div>
  );
}
