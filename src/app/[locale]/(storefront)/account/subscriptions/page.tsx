import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getSubscriptionsByCustomer } from "@/server/queries/subscriptions";
import { getFeatureFlags } from "@/lib/edge-config";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils/format-price";
import { calculateSubscriptionPrice } from "@/lib/utils/subscription-price";
import { SubscriptionActions } from "./subscription-actions";

const STATUS_VARIANT = {
  ACTIVE: "default",
  PAUSED: "secondary",
  PAST_DUE: "destructive",
  CANCELLED: "outline",
  EXPIRED: "outline",
} as const;

export default async function CustomerSubscriptionsPage() {
  const features = await getFeatureFlags();
  if (!features.subscriptions) notFound();
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const t = await getTranslations("account.subscriptions");
  const subs = await getSubscriptionsByCustomer(userId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>

      {subs.length === 0 ? (
        <p className="text-muted-foreground">{t("noSubscriptions")}</p>
      ) : (
        <div className="space-y-4">
          {subs.map((sub) => {
            const price = calculateSubscriptionPrice(
              sub.plan.product.basePrice,
              sub.plan.variant?.priceAdjustment ?? 0,
              sub.plan.discountPercent,
            );

            return (
              <Card key={sub.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{sub.plan.name}</CardTitle>
                    <Badge
                      variant={STATUS_VARIANT[sub.status as keyof typeof STATUS_VARIANT]}
                    >
                      {t(sub.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground">{t("product")}:</span>{" "}
                    {sub.plan.product.name}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">{t("billing")}:</span>{" "}
                    {formatPrice(price)} / {t(sub.plan.interval)}
                  </p>
                  {sub.currentPeriodEnd && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">{t("nextBilling")}:</span>{" "}
                      {sub.currentPeriodEnd.toLocaleDateString()}
                    </p>
                  )}
                  {sub.cancelledAt && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">{t("cancelledOn")}:</span>{" "}
                      {sub.cancelledAt.toLocaleDateString()}
                    </p>
                  )}
                  <SubscriptionActions subscriptionId={sub.id} status={sub.status} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
