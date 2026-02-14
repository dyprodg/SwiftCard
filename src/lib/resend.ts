import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "SwiftCart <noreply@swiftcart.ch>";

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
