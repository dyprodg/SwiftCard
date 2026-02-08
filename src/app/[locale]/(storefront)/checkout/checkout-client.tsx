"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCartStore, selectSubtotal, selectTotalItems } from "@/stores/cart-store";
import { formatPrice } from "@/lib/utils/format-price";
import { checkoutFormSchema, type CheckoutFormValues } from "@/lib/validations/checkout";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function CheckoutClient() {
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const locale = useLocale();
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore(selectSubtotal);
  const totalItems = useCartStore(selectTotalItems);
  const clearCart = useCartStore((s) => s.clearCart);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      name: "",
      email: "",
      address1: "",
      address2: "",
      city: "",
      zip: "",
      country: "CH",
      customerNote: "",
    },
  });

  if (items.length === 0 && !clientSecret) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground text-lg">{t("errors.cartEmpty")}</p>
        <Button className="mt-4" onClick={() => router.push(`/${locale}/products`)}>
          {tCart("continueShopping")}
        </Button>
      </div>
    );
  }

  async function onSubmit(values: CheckoutFormValues) {
    setIsCreatingOrder(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress: {
            name: values.name,
            address1: values.address1,
            address2: values.address2 || "",
            city: values.city,
            zip: values.zip,
            country: values.country,
          },
          customerEmail: values.email,
          customerNote: values.customerNote || "",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("errors.generic"));
        return;
      }

      setClientSecret(data.clientSecret);
      setOrderId(data.orderId);
    } catch {
      setError(t("errors.generic"));
    } finally {
      setIsCreatingOrder(false);
    }
  }

  // If we have a clientSecret, show the Stripe payment form
  if (clientSecret && orderId) {
    return (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: { theme: "stripe" },
        }}
      >
        <PaymentForm
          orderId={orderId}
          locale={locale}
          onSuccess={() => {
            clearCart();
            router.push(`/${locale}/checkout/success?order_id=${orderId}`);
          }}
        />
      </Elements>
    );
  }

  // Otherwise, show the shipping address form
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>{t("shipping.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("shipping.name")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("email")}</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("shipping.address")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("shipping.address2")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("shipping.city")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("shipping.zip")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("shipping.country")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerNote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("note")}</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isCreatingOrder}>
              {isCreatingOrder ? t("processing") : t("payment.title")}
            </Button>
          </form>
        </Form>
      </div>

      {/* Order Summary Sidebar */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>{t("review.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item) => (
              <div
                key={`${item.productId}:${item.variantId ?? "default"}`}
                className="flex gap-3"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="bg-muted flex h-full w-full items-center justify-center text-xs">
                      No img
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.productName}</p>
                  {item.variantName && (
                    <p className="text-muted-foreground text-xs">{item.variantName}</p>
                  )}
                  <p className="text-muted-foreground text-xs">× {item.quantity}</p>
                </div>
                <p className="text-sm font-medium">
                  {formatPrice(item.unitPrice * item.quantity)}
                </p>
              </div>
            ))}

            <Separator />

            <div className="flex justify-between text-sm">
              <span>
                {tCart("subtotal")} ({totalItems} {tCart("items")})
              </span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span>{tCart("shipping")}</span>
              <span className="text-muted-foreground">{tCart("estimatedShipping")}</span>
            </div>

            <Separator />

            <div className="flex justify-between font-semibold">
              <span>{tCart("total")}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ==================== STRIPE PAYMENT FORM ====================

function PaymentForm({
  orderId,
  locale,
  onSuccess,
}: {
  orderId: string;
  locale: string;
  onSuccess: () => void;
}) {
  const t = useTranslations("checkout");
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
        return_url: `${window.location.origin}/${locale}/checkout/success?order_id=${orderId}`,
      },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message ?? t("errors.paymentFailed"));
      setIsProcessing(false);
    } else {
      // Payment succeeded without redirect
      onSuccess();
    }
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>{t("payment.title")}</CardTitle>
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
            {isProcessing ? t("processing") : t("placeOrder")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
