import { Section, Text, Button } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

type SubscriptionConfirmedProps = {
  planName: string;
  interval: string;
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

export function SubscriptionConfirmedEmail({
  planName,
  interval,
  price,
  currency,
  nextBillingDate,
  manageUrl,
}: SubscriptionConfirmedProps) {
  return (
    <EmailLayout preview={`Your subscription to ${planName} is active!`}>
      <Section style={{ padding: "24px" }}>
        <Text style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}>
          Subscription Confirmed
        </Text>
        <Text style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>
          Your subscription is now active. Here are the details:
        </Text>
        <Text style={{ fontSize: "14px", marginBottom: "4px" }}>
          <strong>Plan:</strong> {planName}
        </Text>
        <Text style={{ fontSize: "14px", marginBottom: "4px" }}>
          <strong>Billing:</strong> {formatAmount(price, currency)} / {interval}
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
