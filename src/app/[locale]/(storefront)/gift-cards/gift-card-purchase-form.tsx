"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils/format-price";

const DENOMINATIONS = [2500, 5000, 10000, 20000]; // cents

export function GiftCardPurchaseForm() {
  const t = useTranslations("giftCards");
  const [isPending, startTransition] = useTransition();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");

  const amount = selectedAmount ?? (customAmount ? parseInt(customAmount) * 100 : 0);

  function handleDenomination(value: number) {
    setSelectedAmount(value);
    setCustomAmount("");
  }

  function handleCustom(value: string) {
    setCustomAmount(value);
    setSelectedAmount(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !recipientEmail || !recipientName || !senderName) return;

    startTransition(async () => {
      try {
        // POST to gift card purchase API
        const res = await fetch("/api/gift-card-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            recipientEmail,
            recipientName,
            senderName,
            personalMessage: personalMessage || undefined,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create gift card checkout");
        }

        const data = await res.json();
        // Redirect to Stripe checkout
        if (data.url) {
          window.location.href = data.url;
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("purchaseError"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("denomination")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DENOMINATIONS.map((value) => (
              <Button
                key={value}
                type="button"
                variant={selectedAmount === value ? "default" : "outline"}
                className="h-14 text-lg"
                onClick={() => handleDenomination(value)}
              >
                {formatPrice(value)}
              </Button>
            ))}
          </div>
          <div>
            <Label>{t("customAmount")}</Label>
            <Input
              type="number"
              min={5}
              max={500}
              placeholder="CHF"
              value={customAmount}
              onChange={(e) => handleCustom(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("recipientInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{t("recipientEmail")}</Label>
            <Input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>{t("recipientName")}</Label>
            <Input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>{t("senderName")}</Label>
            <Input
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>{t("personalMessage")}</Label>
            <Textarea
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              rows={3}
              placeholder={t("personalMessagePlaceholder")}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={
          isPending || !amount || !recipientEmail || !recipientName || !senderName
        }
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {amount > 0 ? `${t("buyNow")} - ${formatPrice(amount)}` : t("buyNow")}
      </Button>
    </form>
  );
}
