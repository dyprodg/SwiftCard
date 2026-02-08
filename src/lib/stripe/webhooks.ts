import type Stripe from "stripe";
import { stripe } from "./client";

/**
 * Verify and construct a Stripe webhook event from the raw body + signature.
 */
export function constructEvent(
  body: string | Buffer,
  signature: string,
  secret: string,
): Stripe.Event {
  return stripe.webhooks.constructEvent(body, signature, secret);
}
