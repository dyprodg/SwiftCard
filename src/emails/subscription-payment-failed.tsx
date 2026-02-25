import { Section, Text, Button } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

type SubscriptionPaymentFailedProps = {
  planName: string;
  price: number;
  currency: string;
  manageUrl: string;
};

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("de-CH", { style: "currency", currency }).format(
    cents / 100,
  );
}

export function SubscriptionPaymentFailedEmail({
  planName,
  price,
  currency,
  manageUrl,
}: SubscriptionPaymentFailedProps) {
  return (
    <EmailLayout preview={`Payment failed for your ${planName} subscription`}>
      <Section style={{ padding: "24px" }}>
        <Text style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}>
          Payment Failed
        </Text>
        <Text style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>
          We were unable to process the payment of {formatAmount(price, currency)} for
          your <strong>{planName}</strong> subscription. Please update your payment method
          to keep your subscription active.
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
          Update Payment Method
        </Button>
      </Section>
    </EmailLayout>
  );
}
