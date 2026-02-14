import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "SwiftCart <onboarding@resend.dev>";

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
    to,
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
    to,
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
    to,
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
    to,
    subject: `Your order ${data.orderNumber} has been shipped!`,
    react: OrderShippedEmail(data),
  });
}
