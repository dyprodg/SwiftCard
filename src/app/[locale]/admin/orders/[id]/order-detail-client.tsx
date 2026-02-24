"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Pencil, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  FulfillmentStatusBadge,
} from "@/components/admin/order-status-badge";
import { RefundDialog } from "@/components/admin/refund-dialog";
import { RefundHistory } from "@/components/admin/refund-history";
import { FulfillmentDialog } from "@/components/admin/fulfillment-dialog";
import { FulfillmentHistory } from "@/components/admin/fulfillment-history";
import { ActivityLog } from "@/components/admin/activity-log";
import { formatPrice } from "@/lib/utils/format-price";
import {
  ORDER_STATUS_TRANSITIONS,
  AUTOMATED_TRANSITIONS,
} from "@/lib/constants/order-status";
import {
  updateOrderStatus,
  addInternalNote,
  editShippingAddress,
  editCustomerNote,
} from "@/server/actions/orders";
import type { OrderWithItemsAndRefundsAndFulfillments, OrderEvent } from "@/types";

export function OrderDetailClient({
  order,
  events,
}: {
  order: OrderWithItemsAndRefundsAndFulfillments;
  events: OrderEvent[];
}) {
  const locale = useLocale();
  const t = useTranslations("admin.orders");
  const td = useTranslations("admin.orders.detail");
  const [updating, setUpdating] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [fulfillmentDialogOpen, setFulfillmentDialogOpen] = useState(false);

  // Editable shipping address state
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    shippingName: order.shippingName,
    shippingAddress1: order.shippingAddress1,
    shippingAddress2: order.shippingAddress2 ?? "",
    shippingCity: order.shippingCity,
    shippingZip: order.shippingZip,
    shippingCountry: order.shippingCountry,
  });
  const [savingAddress, setSavingAddress] = useState(false);

  // Editable customer note state
  const [editingNote, setEditingNote] = useState(false);
  const [customerNoteForm, setCustomerNoteForm] = useState(order.customerNote ?? "");
  const [savingNote, setSavingNote] = useState(false);

  const allowedTransitions = (ORDER_STATUS_TRANSITIONS[order.status] ?? []).filter(
    (s) => !AUTOMATED_TRANSITIONS.includes(s),
  );
  const dateLocale = locale === "de" ? "de-CH" : "en-CH";

  const canRefund =
    (order.paymentStatus === "PAID" || order.paymentStatus === "PARTIALLY_REFUNDED") &&
    order.totalRefunded < order.total;

  const canFulfill =
    order.fulfillmentStatus !== "FULFILLED" &&
    order.status !== "CANCELLED" &&
    order.status !== "REFUNDED";

  const canEdit = order.fulfillmentStatus === "UNFULFILLED";

  async function handleStatusChange(newStatus: string) {
    setUpdating(true);
    setError(null);
    const result = await updateOrderStatus(order.id, newStatus);
    if (result.error) {
      setError(result.error);
    }
    setUpdating(false);
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setAddingNote(true);
    await addInternalNote(order.id, noteText.trim());
    setNoteText("");
    setAddingNote(false);
  }

  async function handleSaveAddress() {
    setSavingAddress(true);
    setError(null);
    const result = await editShippingAddress({
      orderId: order.id,
      shippingName: addressForm.shippingName,
      shippingAddress1: addressForm.shippingAddress1,
      shippingAddress2: addressForm.shippingAddress2 || null,
      shippingCity: addressForm.shippingCity,
      shippingZip: addressForm.shippingZip,
      shippingCountry: addressForm.shippingCountry,
    });
    if (result.error) {
      setError(result.error);
    } else {
      setEditingAddress(false);
    }
    setSavingAddress(false);
  }

  async function handleSaveCustomerNote() {
    setSavingNote(true);
    setError(null);
    const result = await editCustomerNote({
      orderId: order.id,
      customerNote: customerNoteForm || null,
    });
    if (result.error) {
      setError(result.error);
    } else {
      setEditingNote(false);
    }
    setSavingNote(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/admin/orders`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
          <p className="text-muted-foreground text-sm">
            {new Date(order.createdAt).toLocaleString(dateLocale)}
          </p>
        </div>
        <FulfillmentStatusBadge status={order.fulfillmentStatus} />
        <OrderStatusBadge status={order.status} />
        <PaymentStatusBadge status={order.paymentStatus} />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Order Items */}
        <Card className="p-6 md:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">{t("items")}</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.productName}</p>
                  {item.variantName && (
                    <p className="text-muted-foreground text-xs">{item.variantName}</p>
                  )}
                  <p className="text-muted-foreground text-xs">
                    {item.quantity} x {formatPrice(item.unitPrice, order.currency)}
                  </p>
                </div>
                <p className="text-sm font-medium">
                  {formatPrice(item.total, order.currency)}
                </p>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{td("subtotal")}</span>
              <span>{formatPrice(order.subtotal, order.currency)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>
                  {td("discount")}
                  {order.discountCode && ` (${order.discountCode})`}
                </span>
                <span>-{formatPrice(order.discountAmount, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{td("shipping")}</span>
              <span>
                {order.shipping === 0
                  ? td("shippingFree")
                  : formatPrice(order.shipping, order.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {order.taxInclusive ? td("taxIncluded") : td("tax")}
              </span>
              <span>{formatPrice(order.tax, order.currency)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>{td("total")}</span>
              <span>{formatPrice(order.total, order.currency)}</span>
            </div>
            {order.totalRefunded > 0 && (
              <div className="flex justify-between text-orange-600">
                <span>{td("refunded")}</span>
                <span>-{formatPrice(order.totalRefunded, order.currency)}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Controls */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">{t("updateStatus")}</h2>
            {allowedTransitions.length > 0 ? (
              <div className="space-y-3">
                <Select onValueChange={handleStatusChange} disabled={updating}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("changeStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedTransitions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(
                          `statuses.${status as "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED"}`,
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {updating && (
                  <p className="text-muted-foreground text-xs">{t("adding")}</p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t("noTransitions")}</p>
            )}

            {/* Fulfill Order Button */}
            {canFulfill && (
              <Button
                variant="default"
                className="mt-3 w-full"
                onClick={() => setFulfillmentDialogOpen(true)}
              >
                {t("fulfillOrder")}
              </Button>
            )}

            {/* Refund Button */}
            {canRefund && (
              <Button
                variant="outline"
                className="mt-3 w-full"
                onClick={() => setRefundDialogOpen(true)}
              >
                {t("processRefund")}
              </Button>
            )}

            {/* Packing Slip */}
            <Button variant="outline" className="mt-3 w-full" asChild>
              <Link
                href={`/${locale}/admin/orders/${order.id}/packing-slip`}
                target="_blank"
              >
                <Printer className="mr-2 h-4 w-4" />
                {t("packingSlip")}
              </Link>
            </Button>

            {/* Timestamps */}
            <div className="mt-4 space-y-2 text-xs">
              {order.paidAt && (
                <p>
                  <span className="text-muted-foreground">{td("paid")} </span>
                  {new Date(order.paidAt).toLocaleString(dateLocale)}
                </p>
              )}
              {order.shippedAt && (
                <p>
                  <span className="text-muted-foreground">{td("shipped")} </span>
                  {new Date(order.shippedAt).toLocaleString(dateLocale)}
                </p>
              )}
              {order.deliveredAt && (
                <p>
                  <span className="text-muted-foreground">{td("delivered")} </span>
                  {new Date(order.deliveredAt).toLocaleString(dateLocale)}
                </p>
              )}
              {order.cancelledAt && (
                <p>
                  <span className="text-muted-foreground">{td("cancelled")} </span>
                  {new Date(order.cancelledAt).toLocaleString(dateLocale)}
                </p>
              )}
            </div>
          </Card>

          {/* Customer Info */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">{t("customer")}</h2>
            <div className="space-y-2 text-sm">
              <p className="font-medium">{order.shippingName}</p>
              <p className="text-muted-foreground">{order.customerEmail}</p>
            </div>
          </Card>

          {/* Shipping Address */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("shippingAddress")}</h2>
              {canEdit && !editingAddress && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingAddress(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
            {editingAddress ? (
              <div className="space-y-2">
                <Input
                  placeholder={td("name")}
                  value={addressForm.shippingName}
                  onChange={(e) =>
                    setAddressForm((f) => ({ ...f, shippingName: e.target.value }))
                  }
                />
                <Input
                  placeholder={td("address1")}
                  value={addressForm.shippingAddress1}
                  onChange={(e) =>
                    setAddressForm((f) => ({ ...f, shippingAddress1: e.target.value }))
                  }
                />
                <Input
                  placeholder={td("address2")}
                  value={addressForm.shippingAddress2}
                  onChange={(e) =>
                    setAddressForm((f) => ({ ...f, shippingAddress2: e.target.value }))
                  }
                />
                <div className="flex gap-2">
                  <Input
                    placeholder={td("zip")}
                    value={addressForm.shippingZip}
                    className="w-1/3"
                    onChange={(e) =>
                      setAddressForm((f) => ({ ...f, shippingZip: e.target.value }))
                    }
                  />
                  <Input
                    placeholder={td("city")}
                    value={addressForm.shippingCity}
                    className="flex-1"
                    onChange={(e) =>
                      setAddressForm((f) => ({ ...f, shippingCity: e.target.value }))
                    }
                  />
                </div>
                <Input
                  placeholder={td("country")}
                  value={addressForm.shippingCountry}
                  onChange={(e) =>
                    setAddressForm((f) => ({ ...f, shippingCountry: e.target.value }))
                  }
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveAddress} disabled={savingAddress}>
                    {td("save")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingAddress(false);
                      setAddressForm({
                        shippingName: order.shippingName,
                        shippingAddress1: order.shippingAddress1,
                        shippingAddress2: order.shippingAddress2 ?? "",
                        shippingCity: order.shippingCity,
                        shippingZip: order.shippingZip,
                        shippingCountry: order.shippingCountry,
                      });
                    }}
                  >
                    {td("cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm leading-relaxed">
                <p>{order.shippingName}</p>
                <p>{order.shippingAddress1}</p>
                {order.shippingAddress2 && <p>{order.shippingAddress2}</p>}
                <p>
                  {order.shippingZip} {order.shippingCity}
                </p>
                <p>{order.shippingCountry}</p>
                {order.phone && (
                  <p className="text-muted-foreground mt-1">{order.phone}</p>
                )}
              </div>
            )}
          </Card>

          {/* Internal Notes */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">{t("internalNotes")}</h2>
            {order.internalNote && (
              <pre className="text-muted-foreground mb-4 text-xs whitespace-pre-wrap">
                {order.internalNote}
              </pre>
            )}
            {/* Customer Note (editable) */}
            {(order.customerNote || canEdit) && (
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">{t("customerNote")}:</p>
                  {canEdit && !editingNote && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setEditingNote(true)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {editingNote ? (
                  <div className="mt-1 space-y-2">
                    <Textarea
                      value={customerNoteForm}
                      onChange={(e) => setCustomerNoteForm(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveCustomerNote}
                        disabled={savingNote}
                      >
                        {td("save")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingNote(false);
                          setCustomerNoteForm(order.customerNote ?? "");
                        }}
                      >
                        {td("cancel")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    {order.customerNote || "-"}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Textarea
                placeholder={t("addNotePlaceholder")}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={2}
              />
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={addingNote || !noteText.trim()}
              >
                {addingNote ? t("adding") : t("addNote")}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Fulfillment History */}
      <FulfillmentHistory order={order} />

      {/* Refund History */}
      <RefundHistory order={order} />

      {/* Activity Log */}
      <ActivityLog events={events} />

      {/* Fulfillment Dialog */}
      <FulfillmentDialog
        order={order}
        open={fulfillmentDialogOpen}
        onOpenChange={setFulfillmentDialogOpen}
      />

      {/* Refund Dialog */}
      <RefundDialog
        order={order}
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
      />
    </div>
  );
}
