import Link from "next/link";
import { Gift } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GiftCardPurchaseForm } from "./gift-card-purchase-form";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function GiftCardsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("giftCards");

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 text-center">
        <Gift className="mx-auto mb-4 h-12 w-12" />
        <h1 className="text-3xl font-bold">{t("purchaseTitle")}</h1>
        <p className="text-muted-foreground mt-2">{t("purchaseDescription")}</p>
      </div>

      <GiftCardPurchaseForm />

      <div className="mt-8 text-center">
        <Button variant="link" asChild>
          <Link href={`/${locale}/gift-cards/check-balance`}>{t("checkBalance")}</Link>
        </Button>
      </div>
    </div>
  );
}
