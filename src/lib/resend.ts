import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "SwiftCard <onboarding@resend.dev>";

/**
 * In test mode, all emails are redirected to RESEND_TEST_EMAIL.
 * Set RESEND_TEST_MODE=true and RESEND_TEST_EMAIL=you@example.com in .env.local
 */
function resolveRecipient(to: string): string {
  if (process.env.RESEND_TEST_MODE === "true" && process.env.RESEND_TEST_EMAIL) {
    return process.env.RESEND_TEST_EMAIL;
  }
  return to;
}

export async function sendOrderConfirmationEmail(
  to: string,
  data: {
    orderNumber: string;
    items: {
      productName: string;
      variantName: string | null;
      quantity: number;
      unitPrice: number;
      total: number;
    }[];
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
    orderViewUrl?: string;
  },
) {
  const { OrderConfirmationEmail } = await import("@/emails/order-confirmation");

  return resend.emails.send({
    from: FROM_EMAIL,
    to: resolveRecipient(to),
    subject: `Order Confirmed - ${data.orderNumber}`,
    react: OrderConfirmationEmail(data),
  });
}

export async function sendOrderCreatedEmail(
  to: string,
  data: {
    orderNumber: string;
    items: {
      productName: string;
      variantName: string | null;
      quantity: number;
      total: number;
    }[];
    total: number;
    currency: string;
    orderViewUrl: string;
  },
) {
  const { OrderCreatedEmail } = await import("@/emails/order-created");

  return resend.emails.send({
    from: FROM_EMAIL,
    to: resolveRecipient(to),
    subject: `Order Received - ${data.orderNumber}`,
    react: OrderCreatedEmail(data),
  });
}

export async function sendPaymentFailedEmail(
  to: string,
  data: {
    orderNumber: string;
    total: number;
    currency: string;
    orderViewUrl: string;
  },
) {
  const { PaymentFailedEmail } = await import("@/emails/payment-failed");

  return resend.emails.send({
    from: FROM_EMAIL,
    to: resolveRecipient(to),
    subject: `Payment Failed - ${data.orderNumber}`,
    react: PaymentFailedEmail(data),
  });
}

export async function sendShippingNotificationEmail(
  to: string,
  data: {
    orderNumber: string;
    shippingName: string;
    trackingNumber?: string;
    trackingUrl?: string;
  },
) {
  const { OrderShippedEmail } = await import("@/emails/order-shipped");

  return resend.emails.send({
    from: FROM_EMAIL,
    to: resolveRecipient(to),
    subject: `Your order ${data.orderNumber} has been shipped!`,
    react: OrderShippedEmail(data),
  });
}

export async function sendBackInStockEmail(
  to: string,
  data: {
    productName: string;
    productUrl: string;
    variantName?: string;
  },
) {
  const { BackInStockEmail } = await import("@/emails/back-in-stock");

  return resend.emails.send({
    from: FROM_EMAIL,
    to: resolveRecipient(to),
    subject: `${data.productName} is back in stock!`,
    react: BackInStockEmail(data),
  });
}

export async function sendRefundNotificationEmail(
  to: string,
  data: {
    orderNumber: string;
    refundAmount: number;
    currency: string;
    reason: string;
    isFullRefund: boolean;
    items?: {
      productName: string;
      variantName: string | null;
      quantity: number;
      amount: number;
    }[];
    orderViewUrl?: string;
  },
) {
  const { RefundNotificationEmail } = await import("@/emails/refund-notification");

  return resend.emails.send({
    from: FROM_EMAIL,
    to: resolveRecipient(to),
    subject: `Refund Processed - ${data.orderNumber}`,
    react: RefundNotificationEmail(data),
  });
}
