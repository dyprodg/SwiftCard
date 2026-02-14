"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils/format-price";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type OrderItem = {
  id: string;
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
};

type OrderData = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  shippingName: string;
  shippingAddress1: string;
  shippingAddress2: string | null;
  shippingCity: string;
  shippingZip: string;
  shippingCountry: string;
  createdAt: string;
  items: OrderItem[];
};

type Translations = {
  orderNumber: string;
  date: string;
  status: string;
  paymentStatus: string;
  items: string;
  subtotal: string;
  tax: string;
  shipping: string;
  shippingFree: string;
  total: string;
  shippingAddress: string;
  retryPayment: string;
  retryBanner: string;
  processing: string;
  paymentFailed: string;
  paymentBeingProcessed: string;
  continueShopping: string;
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
};

const paymentStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
};

export function OrderViewClient({
  order,
  token,
  locale,
  translations: t,
}: {
  order: OrderData;
  token: string;
  locale: string;
  translations: Translations;
}) {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show retry for FAILED (not PENDING — payment is in-flight)
  const canRetry = order.paymentStatus === "FAILED" && order.status !== "CANCELLED";

  const isPending = order.paymentStatus === "PENDING";

  // Poll for status when payment is PENDING
  useEffect(() => {
    if (!isPending) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/orders/${order.id}/status?token=${encodeURIComponent(token)}`,
        );
        if (!res.ok) return;

        const data = await res.json();

        if (data.paymentStatus !== "PENDING") {
          clearInterval(interval);
          router.refresh();
        }
      } catch {
        // Network error — keep trying
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPending, order.id, token, router]);

  async function handleRetry() {
    setIsRetrying(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${order.id}/retry-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.paymentFailed);
        return;
      }

      setClientSecret(data.clientSecret);
    } catch {
      setError(t.paymentFailed);
    } finally {
      setIsRetrying(false);
    }
  }

  // Show Stripe payment form after retry
  if (clientSecret) {
    return (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: { theme: "stripe" },
        }}
      >
        <RetryPaymentForm
          orderId={order.id}
          locale={locale}
          token={token}
          translations={t}
        />
      </Elements>
    );
  }

  return (
    <div className="space-y-6">
      {/* Retry payment banner — only for FAILED */}
      {canRetry && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">{t.retryBanner}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRetry}
            disabled={isRetrying}
            className="border-amber-300 bg-amber-100 hover:bg-amber-200"
          >
            {isRetrying ? t.processing : t.retryPayment}
          </Button>
        </div>
      )}

      {/* Pending payment banner */}
      {isPending && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{t.paymentBeingProcessed}</span>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {t.orderNumber}: {order.orderNumber}
            </span>
            <div className="flex gap-2">
              <Badge variant="outline" className={statusColors[order.status] ?? ""}>
                {order.status}
              </Badge>
              <Badge
                variant="outline"
                className={paymentStatusColors[order.paymentStatus] ?? ""}
              >
                {order.paymentStatus}
              </Badge>
            </div>
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            {t.date}:{" "}
            {new Date(order.createdAt).toLocaleDateString("de-CH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Order items */}
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.productName}
                {item.variantName && ` (${item.variantName})`} x {item.quantity}
              </span>
              <span>{formatPrice(item.total, order.currency)}</span>
            </div>
          ))}

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{t.subtotal}</span>
              <span>{formatPrice(order.subtotal, order.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t.tax}</span>
              <span>{formatPrice(order.tax, order.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t.shipping}</span>
              <span>
                {order.shipping === 0
                  ? t.shippingFree
                  : formatPrice(order.shipping, order.currency)}
              </span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between text-lg font-bold">
            <span>{t.total}</span>
            <span>{formatPrice(order.total, order.currency)}</span>
          </div>

          <Separator />

          <div className="text-sm">
            <p className="mb-1 font-medium">{t.shippingAddress}</p>
            <p>{order.shippingName}</p>
            <p>{order.shippingAddress1}</p>
            {order.shippingAddress2 && <p>{order.shippingAddress2}</p>}
            <p>
              {order.shippingZip} {order.shippingCity}
            </p>
            <p>{order.shippingCountry}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button asChild variant="outline">
          <Link href={`/${locale}/products`}>{t.continueShopping}</Link>
        </Button>
      </div>
    </div>
  );
}

function RetryPaymentForm({
  orderId,
  locale,
  token,
  translations: t,
}: {
  orderId: string;
  locale: string;
  token: string;
  translations: Translations;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/${locale}/order/${orderId}?token=${token}`,
      },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message ?? t.paymentFailed);
      setIsProcessing(false);
    } else {
      // Payment succeeded — reload to show updated status
      window.location.reload();
    }
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>{t.retryPayment}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement />

          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isProcessing || !stripe || !elements}
          >
            {isProcessing ? t.processing : t.retryPayment}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
