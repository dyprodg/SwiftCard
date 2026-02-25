"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils/format-price";
import { calculateSubscriptionPrice, intervalKey } from "@/lib/utils/subscription-price";
import { createSubscriptionCheckout } from "@/server/actions/subscriptions";
import type { SubscriptionPlan, ProductVariant } from "@/types";

type Props = {
  plans: (SubscriptionPlan & { variant: ProductVariant | null })[];
  basePrice: number;
};

export function SubscriptionOptions({ plans, basePrice }: Props) {
  const t = useTranslations("products");
  const [isPending, startTransition] = useTransition();

  if (plans.length === 0) return null;

  function handleSubscribe(planId: string) {
    startTransition(async () => {
      try {
        const result = await createSubscriptionCheckout(planId);
        if (result.url) {
          window.location.href = result.url;
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("subscribeError"));
      }
    });
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{t("subscriptionOptions")}</h3>
      {plans.map((plan) => {
        const subPrice = calculateSubscriptionPrice(
          basePrice,
          plan.variant?.priceAdjustment ?? 0,
          plan.discountPercent,
        );
        const fullPrice = basePrice + (plan.variant?.priceAdjustment ?? 0);
        const hasDiscount = plan.discountPercent > 0;

        return (
          <div
            key={plan.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{plan.name}</span>
                {hasDiscount && (
                  <Badge variant="secondary" className="text-xs">
                    {t("savePercent", {
                      percent: (plan.discountPercent / 100).toFixed(0),
                    })}
                  </Badge>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold">{formatPrice(subPrice)}</span>
                <span className="text-muted-foreground text-xs">
                  {t(intervalKey(plan.interval))}
                </span>
                {hasDiscount && (
                  <span className="text-muted-foreground text-xs line-through">
                    {formatPrice(fullPrice)}
                  </span>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => handleSubscribe(plan.id)}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  {t("subscribe")}
                </>
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
