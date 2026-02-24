"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils/format-price";
import {
  approveReturn,
  rejectReturn,
  markReturnReceived,
  refundReturn,
} from "@/server/actions/returns";

type ReturnData = {
  id: string;
  orderId: string;
  customerId: string;
  customerEmail: string;
  status: string;
  reason: string;
  note: string | null;
  adminNote: string | null;
  refundId: string | null;
  createdAt: Date;
  approvedAt: Date | null;
  receivedAt: Date | null;
  refundedAt: Date | null;
  rejectedAt: Date | null;
  items: {
    id: string;
    orderItemId: string;
    quantity: number;
    reason: string | null;
  }[];
  order: {
    id: string;
    orderNumber: string;
    currency: string;
    items: {
      id: string;
      productName: string;
      variantName: string | null;
      quantity: number;
      unitPrice: number;
      total: number;
    }[];
  };
};

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  APPROVED: "bg-blue-100 text-blue-800 border-blue-200",
  RECEIVED: "bg-purple-100 text-purple-800 border-purple-200",
  REFUNDED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
};

export function ReturnDetailClient({ returnData }: { returnData: ReturnData }) {
  const locale = useLocale();
  const t = useTranslations("admin.returns.detail");
  const dateLocale = locale === "de" ? "de-CH" : "en-CH";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [refundOpen, setRefundOpen] = useState(false);
  const [restoreStock, setRestoreStock] = useState(true);

  async function handleApprove() {
    setLoading(true);
    setError(null);
    const result = await approveReturn({ returnId: returnData.id });
    if (result.error) setError(result.error);
    setLoading(false);
  }

  async function handleReject() {
    setLoading(true);
    setError(null);
    const result = await rejectReturn({
      returnId: returnData.id,
      adminNote: rejectReason,
    });
    if (result.error) setError(result.error);
    else setRejectOpen(false);
    setLoading(false);
  }

  async function handleReceived() {
    setLoading(true);
    setError(null);
    const result = await markReturnReceived({ returnId: returnData.id });
    if (result.error) setError(result.error);
    setLoading(false);
  }

  async function handleRefund() {
    setLoading(true);
    setError(null);
    const result = await refundReturn({
      returnId: returnData.id,
      restoreStock,
    });
    if (result.error) setError(result.error);
    else setRefundOpen(false);
    setLoading(false);
  }

  // Calculate estimated refund
  const estimatedRefund = returnData.items.reduce((sum, ri) => {
    const oi = returnData.order.items.find((i) => i.id === ri.orderItemId);
    return sum + (oi ? oi.unitPrice * ri.quantity : 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/admin/returns`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <p className="text-muted-foreground text-sm">
            {t("orderLink")}:{" "}
            <Link
              href={`/${locale}/admin/orders/${returnData.orderId}`}
              className="text-primary hover:underline"
            >
              {returnData.order.orderNumber}
            </Link>
          </p>
        </div>
        <Badge variant="outline" className={STATUS_COLORS[returnData.status] ?? ""}>
          {returnData.status}
        </Badge>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Return Items */}
        <Card className="p-6 md:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">{t("items")}</h2>
          <div className="space-y-3">
            {returnData.items.map((ri) => {
              const oi = returnData.order.items.find((i) => i.id === ri.orderItemId);
              if (!oi) return null;
              return (
                <div key={ri.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{oi.productName}</p>
                    {oi.variantName && (
                      <p className="text-muted-foreground text-xs">{oi.variantName}</p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      {t("returnQty")}: {ri.quantity} / {oi.quantity}
                    </p>
                    {ri.reason && (
                      <p className="text-muted-foreground text-xs">
                        {t("itemReason")}: {ri.reason}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-medium">
                    {formatPrice(oi.unitPrice * ri.quantity, returnData.order.currency)}
                  </p>
                </div>
              );
            })}
          </div>

          <Separator className="my-4" />

          <div className="flex justify-between font-semibold">
            <span>{t("estimatedRefund")}</span>
            <span>{formatPrice(estimatedRefund, returnData.order.currency)}</span>
          </div>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">{t("info")}</h2>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">{t("customer")}</p>
                <p>{returnData.customerEmail}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t("reason")}</p>
                <p>{returnData.reason}</p>
              </div>
              {returnData.note && (
                <div>
                  <p className="text-muted-foreground text-xs">{t("customerNote")}</p>
                  <p className="text-sm">{returnData.note}</p>
                </div>
              )}
              {returnData.adminNote && (
                <div>
                  <p className="text-muted-foreground text-xs">{t("adminNote")}</p>
                  <p className="text-sm">{returnData.adminNote}</p>
                </div>
              )}
            </div>

            {/* Timestamps */}
            <div className="mt-4 space-y-1 text-xs">
              <p>
                <span className="text-muted-foreground">{t("createdAt")} </span>
                {new Date(returnData.createdAt).toLocaleString(dateLocale)}
              </p>
              {returnData.approvedAt && (
                <p>
                  <span className="text-muted-foreground">{t("approvedAt")} </span>
                  {new Date(returnData.approvedAt).toLocaleString(dateLocale)}
                </p>
              )}
              {returnData.receivedAt && (
                <p>
                  <span className="text-muted-foreground">{t("receivedAt")} </span>
                  {new Date(returnData.receivedAt).toLocaleString(dateLocale)}
                </p>
              )}
              {returnData.refundedAt && (
                <p>
                  <span className="text-muted-foreground">{t("refundedAt")} </span>
                  {new Date(returnData.refundedAt).toLocaleString(dateLocale)}
                </p>
              )}
              {returnData.rejectedAt && (
                <p>
                  <span className="text-muted-foreground">{t("rejectedAt")} </span>
                  {new Date(returnData.rejectedAt).toLocaleString(dateLocale)}
                </p>
              )}
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">{t("actions")}</h2>
            <div className="space-y-2">
              {returnData.status === "REQUESTED" && (
                <>
                  <Button className="w-full" onClick={handleApprove} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("approve")}
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setRejectOpen(true)}
                    disabled={loading}
                  >
                    {t("reject")}
                  </Button>
                </>
              )}
              {returnData.status === "APPROVED" && (
                <Button className="w-full" onClick={handleReceived} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("markReceived")}
                </Button>
              )}
              {returnData.status === "RECEIVED" && (
                <Button
                  className="w-full"
                  onClick={() => setRefundOpen(true)}
                  disabled={loading}
                >
                  {t("processRefund")}
                </Button>
              )}
              {returnData.status === "REFUNDED" && returnData.refundId && (
                <p className="text-muted-foreground text-sm">{t("refundProcessed")}</p>
              )}
              {returnData.status === "REJECTED" && (
                <p className="text-muted-foreground text-sm">{t("returnRejected")}</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rejectTitle")}</DialogTitle>
            <DialogDescription>{t("rejectDescription")}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t("rejectionReasonPlaceholder")}
            rows={3}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={loading || !rejectReason.trim()}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("confirmReject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("refundTitle")}</DialogTitle>
            <DialogDescription>
              {t("refundDescription", {
                amount: formatPrice(estimatedRefund, returnData.order.currency),
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Checkbox
              id="restore-stock"
              checked={restoreStock}
              onCheckedChange={(v) => setRestoreStock(v === true)}
            />
            <Label htmlFor="restore-stock">{t("restoreStock")}</Label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRefundOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleRefund} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("confirmRefund")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
