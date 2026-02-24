"use client";

import { useState, useTransition } from "react";
import { Bell, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeStockNotification } from "@/server/actions/stock-notifications";

type NotifyMeButtonProps = {
  variantId: string;
  productId: string;
};

export function NotifyMeButton({ variantId, productId }: NotifyMeButtonProps) {
  const t = useTranslations("stockNotification");
  const { user } = useUser();
  const [email, setEmail] = useState(user?.emailAddresses[0]?.emailAddress ?? "");
  const [showInput, setShowInput] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubscribe() {
    if (!email) {
      toast.error(t("enterEmail"));
      return;
    }

    startTransition(async () => {
      const result = await subscribeStockNotification({ email, variantId, productId });
      if (result.success) {
        setSubscribed(true);
        toast.success(t("subscribed"));
      } else {
        toast.error(result.error ?? t("error"));
      }
    });
  }

  if (subscribed) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Check className="h-4 w-4" />
        {t("subscribed")}
      </div>
    );
  }

  if (!showInput) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowInput(true)}
        className="gap-2"
      >
        <Bell className="h-4 w-4" />
        {t("notifyMe")}
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("emailPlaceholder")}
        className="h-9 max-w-[220px]"
      />
      <Button size="sm" onClick={handleSubscribe} disabled={isPending}>
        {isPending ? t("subscribing") : t("notify")}
      </Button>
    </div>
  );
}
