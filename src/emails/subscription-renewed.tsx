import { Section, Text, Button } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

type SubscriptionRenewedProps = {
  planName: string;
  orderNumber: string;
  price: number;
  currency: string;
  nextBillingDate: string;
  manageUrl: string;
};

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("de-CH", { style: "currency", currency }).format(
    cents / 100,
  );
}

export function SubscriptionRenewedEmail({
  planName,
  orderNumber,
  price,
  currency,
  nextBillingDate,
  manageUrl,
}: SubscriptionRenewedProps) {
  return (
    <EmailLayout preview={`Your subscription to ${planName} has renewed.`}>
      <Section style={{ padding: "24px" }}>
        <Text style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}>
          Subscription Renewed
        </Text>
        <Text style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>
          Your subscription has been renewed. A new order has been created.
        </Text>
        <Text style={{ fontSize: "14px", marginBottom: "4px" }}>
          <strong>Plan:</strong> {planName}
        </Text>
        <Text style={{ fontSize: "14px", marginBottom: "4px" }}>
          <strong>Order:</strong> #{orderNumber}
        </Text>
        <Text style={{ fontSize: "14px", marginBottom: "4px" }}>
          <strong>Amount:</strong> {formatAmount(price, currency)}
        </Text>
        <Text style={{ fontSize: "14px", marginBottom: "16px" }}>
          <strong>Next billing date:</strong> {nextBillingDate}
        </Text>
        <Button
          href={manageUrl}
          style={{
            backgroundColor: "#000",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "14px",
          }}
        >
          Manage Subscription
        </Button>
      </Section>
    </EmailLayout>
  );
}
