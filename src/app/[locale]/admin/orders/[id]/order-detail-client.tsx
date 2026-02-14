"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
} from "@/components/admin/order-status-badge";
import { formatPrice } from "@/lib/utils/format-price";
import { ORDER_STATUS_TRANSITIONS } from "@/lib/constants/order-status";
import { updateOrderStatus, addInternalNote } from "@/server/actions/orders";
import type { OrderWithItems } from "@/types";

export function OrderDetailClient({ order }: { order: OrderWithItems }) {
  const locale = useLocale();
  const [updating, setUpdating] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedTransitions = ORDER_STATUS_TRANSITIONS[order.status] ?? [];

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
            {new Date(order.createdAt).toLocaleString("de-CH")}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
        <PaymentStatusBadge status={order.paymentStatus} />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Order Items */}
        <Card className="p-6 md:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Items</h2>
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
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(order.subtotal, order.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>
                {order.shipping === 0
                  ? "Free"
                  : formatPrice(order.shipping, order.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatPrice(order.tax, order.currency)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatPrice(order.total, order.currency)}</span>
            </div>
          </div>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Controls */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Update Status</h2>
            {allowedTransitions.length > 0 ? (
              <div className="space-y-3">
                <Select onValueChange={handleStatusChange} disabled={updating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Change status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedTransitions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {updating && <p className="text-muted-foreground text-xs">Updating...</p>}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No status transitions available.
              </p>
            )}

            {/* Timestamps */}
            <div className="mt-4 space-y-2 text-xs">
              {order.paidAt && (
                <p>
                  <span className="text-muted-foreground">Paid: </span>
                  {new Date(order.paidAt).toLocaleString("de-CH")}
                </p>
              )}
              {order.shippedAt && (
                <p>
                  <span className="text-muted-foreground">Shipped: </span>
                  {new Date(order.shippedAt).toLocaleString("de-CH")}
                </p>
              )}
              {order.deliveredAt && (
                <p>
                  <span className="text-muted-foreground">Delivered: </span>
                  {new Date(order.deliveredAt).toLocaleString("de-CH")}
                </p>
              )}
              {order.cancelledAt && (
                <p>
                  <span className="text-muted-foreground">Cancelled: </span>
                  {new Date(order.cancelledAt).toLocaleString("de-CH")}
                </p>
              )}
            </div>
          </Card>

          {/* Customer Info */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Customer</h2>
            <div className="space-y-2 text-sm">
              <p className="font-medium">{order.shippingName}</p>
              <p className="text-muted-foreground">{order.customerEmail}</p>
            </div>
          </Card>

          {/* Shipping Address */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Shipping Address</h2>
            <div className="text-sm leading-relaxed">
              <p>{order.shippingName}</p>
              <p>{order.shippingAddress1}</p>
              {order.shippingAddress2 && <p>{order.shippingAddress2}</p>}
              <p>
                {order.shippingZip} {order.shippingCity}
              </p>
              <p>{order.shippingCountry}</p>
            </div>
          </Card>

          {/* Internal Notes */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Internal Notes</h2>
            {order.internalNote && (
              <pre className="text-muted-foreground mb-4 text-xs whitespace-pre-wrap">
                {order.internalNote}
              </pre>
            )}
            {order.customerNote && (
              <div className="mb-4">
                <p className="text-xs font-medium">Customer Note:</p>
                <p className="text-muted-foreground text-xs">{order.customerNote}</p>
              </div>
            )}
            <div className="space-y-2">
              <Textarea
                placeholder="Add a note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={2}
              />
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={addingNote || !noteText.trim()}
              >
                {addingNote ? "Adding..." : "Add Note"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
