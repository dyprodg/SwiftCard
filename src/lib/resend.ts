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

export async function sendAbandonedCartEmail(
  to: string,
  data: {
    items: { productName: string; quantity: number; unitPrice: number }[];
    subtotal: number;
    currency: string;
    recoveryUrl: string;
  },
) {
  const { AbandonedCartEmail } = await import("@/emails/abandoned-cart");

  return resend.emails.send({
    from: FROM_EMAIL,
    to: resolveRecipient(to),
    subject: "You left items in your cart!",
    react: AbandonedCartEmail(data),
  });
}

export async function sendDisputeNotificationEmail(
  to: string,
  data: {
    orderNumber: string;
    disputeAmount: number;
    currency: string;
    reason: string;
    customerEmail: string;
    adminUrl: string;
  },
) {
  const { DisputeNotificationEmail } = await import("@/emails/dispute-notification");

  return resend.emails.send({
    from: FROM_EMAIL,
    to: resolveRecipient(to),
    subject: `Payment Dispute - ${data.orderNumber}`,
    react: DisputeNotificationEmail(data),
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

export async function sendReturnApprovedEmail(
  to: string,
  data: {
    orderNumber: string;
    items: {
      productName: string;
      variantName: string | null;
      quantity: number;
    }[];
    orderViewUrl: string;
  },
) {
  const { ReturnApprovedEmail } = await import("@/emails/return-approved");

  return resend.emails.send({
    from: FROM_EMAIL,
    to: resolveRecipient(to),
    subject: `Return Approved - ${data.orderNumber}`,
    react: ReturnApprovedEmail(data),
  });
}

export async function sendReturnRejectedEmail(
  to: string,
  data: {
    orderNumber: string;
    rejectionReason: string;
    orderViewUrl: string;
  },
) {
  const { ReturnRejectedEmail } = await import("@/emails/return-rejected");

  return resend.emails.send({
    from: FROM_EMAIL,
    to: resolveRecipient(to),
    subject: `Return Update - ${data.orderNumber}`,
    react: ReturnRejectedEmail(data),
  });
}

export async function sendReturnReceivedEmail(
  to: string,
  data: {
    orderNumber: string;
    orderViewUrl: string;
  },
) {
  const { ReturnReceivedEmail } = await import("@/emails/return-received");

  return resend.emails.send({
    from: FROM_EMAIL,
    to: resolveRecipient(to),
    subject: `Return Received - ${data.orderNumber}`,
    react: ReturnReceivedEmail(data),
  });
}

export async function sendSubscriptionConfirmedEmail(
  to: string,
  data: {
    planName: string;
    interval: string;
    price: number;
    currency: string;
    nextBillingDate: string;
    manageUrl: string;
  },
) {
  const { SubscriptionConfirmedEmail } = await import("@/emails/subscription-confirmed");

  return resend.emails.send({
    from: FROM_EMAIL,
    to: resolveRecipient(to),
    subject: `Subscription Confirmed — ${data.planName}`,
    react: SubscriptionConfirmedEmail(data),
  });
}

export async function sendSubscriptionRenewedEmail(
  to: string,
  data: {
    planName: string;
    orderNumber: string;
    price: number;
    currency: string;
    nextBillingDate: string;
    manageUrl: string;
  },
) {
  const { SubscriptionRenewedEmail } = await import("@/emails/subscription-renewed");

  return resend.emails.send({
    from: FROM_EMAIL,
    to: resolveRecipient(to),
    subject: `Subscription Renewed — ${data.planName}`,
    react: SubscriptionRenewedEmail(data),
  });
}

export async function sendSubscriptionPaymentFailedEmail(
  to: string,
  data: {
    planName: string;
    price: number;
    currency: string;
    manageUrl: string;
  },
) {
  const { SubscriptionPaymentFailedEmail } =
    await import("@/emails/subscription-payment-failed");

  return resend.emails.send({
    from: FROM_EMAIL,
    to: resolveRecipient(to),
    subject: `Payment Failed — ${data.planName}`,
    react: SubscriptionPaymentFailedEmail(data),
  });
}

export async function sendSubscriptionCancelledEmail(
  to: string,
  data: {
    planName: string;
    endDate: string;
    shopUrl: string;
  },
) {
  const { SubscriptionCancelledEmail } = await import("@/emails/subscription-cancelled");

  return resend.emails.send({
    from: FROM_EMAIL,
    to: resolveRecipient(to),
    subject: `Subscription Cancelled — ${data.planName}`,
    react: SubscriptionCancelledEmail(data),
  });
}

export async function sendPaymentLinkEmail(
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
    paymentUrl: string;
    expiresAt: Date;
    customMessage?: string;
    orderViewUrl?: string;
  },
) {
  const { PaymentLinkEmail } = await import("@/emails/payment-link");

  return resend.emails.send({
    from: FROM_EMAIL,
    to: resolveRecipient(to),
    subject: `Payment Link - ${data.orderNumber}`,
    react: PaymentLinkEmail(data),
  });
}

export async function sendGiftCardEmail(
  to: string,
  data: {
    recipientName: string;
    senderName: string;
    code: string;
    amount: string;
    personalMessage?: string;
    expiresAt?: string;
  },
) {
  const { GiftCardReceivedEmail } = await import("@/emails/gift-card-received");

  return resend.emails.send({
    from: FROM_EMAIL,
    to: resolveRecipient(to),
    subject: `You received a ${data.amount} gift card from ${data.senderName}!`,
    react: GiftCardReceivedEmail(data),
  });
}
