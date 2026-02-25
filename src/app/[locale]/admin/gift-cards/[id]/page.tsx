import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getGiftCardById } from "@/server/queries/gift-cards";
import { formatPrice } from "@/lib/utils/format-price";
import { formatGiftCardCode } from "@/lib/utils/gift-card-code";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GiftCardActions } from "@/components/admin/gift-card-actions";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

const STATUS_VARIANT = {
  ACTIVE: "default",
  DISABLED: "destructive",
  FULLY_REDEEMED: "secondary",
  EXPIRED: "outline",
} as const;

const TXN_TYPE_VARIANT = {
  PURCHASE: "default",
  REDEMPTION: "secondary",
  REFUND: "outline",
  ADJUSTMENT: "outline",
  EXPIRATION: "destructive",
} as const;

export default async function GiftCardDetailPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("admin.giftCards");
  const card = await getGiftCardById(id);

  if (!card) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("cardDetail")}</h1>
          <p className="font-mono text-lg">{formatGiftCardCode(card.code)}</p>
        </div>
        <GiftCardActions card={card} />
      </div>

      {/* Card Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("statusCol")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={STATUS_VARIANT[card.status as keyof typeof STATUS_VARIANT]}>
              {t(card.status)}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("currentBalance")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(card.currentBalance)}</p>
            <p className="text-muted-foreground text-sm">
              {t("of")} {formatPrice(card.initialBalance)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("recipient")}</span>
              <span>{card.recipientEmail || "--"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("recipientName")}</span>
              <span>{card.recipientName || "--"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("senderName")}</span>
              <span>{card.senderName || "--"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("issuedAt")}</span>
              <span>{card.createdAt.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("expiresAt")}</span>
              <span>
                {card.expiresAt ? card.expiresAt.toLocaleDateString() : t("noExpiry")}
              </span>
            </div>
            {card.issuedByAdmin && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("issuedBy")}</span>
                <span>{t("admin")}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {card.personalMessage && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("personalMessage")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">{card.personalMessage}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("transactions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("txnDate")}</TableHead>
                <TableHead>{t("txnType")}</TableHead>
                <TableHead className="text-right">{t("txnAmount")}</TableHead>
                <TableHead className="text-right">{t("txnBalance")}</TableHead>
                <TableHead>{t("txnNote")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {card.transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-16 text-center">
                    {t("noTransactions")}
                  </TableCell>
                </TableRow>
              ) : (
                card.transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell>{txn.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          TXN_TYPE_VARIANT[txn.type as keyof typeof TXN_TYPE_VARIANT]
                        }
                      >
                        {t(txn.type)}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono ${txn.amount >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {txn.amount >= 0 ? "+" : ""}
                      {formatPrice(txn.amount)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatPrice(txn.balanceAfter)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {txn.note || "--"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
