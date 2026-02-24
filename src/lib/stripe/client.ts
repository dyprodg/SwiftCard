import Stripe from "stripe";

// Server-side Stripe client (lazy singleton — avoids crash when env var is missing at build time)
let _stripe: Stripe | null = null;

export function getStripeServer() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    });
  }
  return _stripe;
}

/** @deprecated Use getStripeServer() instead */
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripeServer() as Record<string | symbol, unknown>)[prop];
  },
});

// Client-side: lazy-loaded Stripe.js
let stripePromise: ReturnType<typeof import("@stripe/stripe-js").loadStripe> | null =
  null;

export function getStripe() {
  if (!stripePromise) {
    // Dynamic import to avoid loading Stripe.js on server
    stripePromise = import("@stripe/stripe-js").then((mod) =>
      mod.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!),
    );
  }
  return stripePromise;
}
