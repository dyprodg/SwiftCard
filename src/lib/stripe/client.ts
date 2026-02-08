import Stripe from "stripe";

// Server-side Stripe client (singleton)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
  typescript: true,
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
