import { Section, Text, Button } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

type SubscriptionCancelledProps = {
  planName: string;
  endDate: string;
  shopUrl: string;
};

export function SubscriptionCancelledEmail({
  planName,
  endDate,
  shopUrl,
}: SubscriptionCancelledProps) {
  return (
    <EmailLayout preview={`Your ${planName} subscription has been cancelled`}>
      <Section style={{ padding: "24px" }}>
        <Text style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}>
          Subscription Cancelled
        </Text>
        <Text style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>
          Your <strong>{planName}</strong> subscription has been cancelled. You will
          continue to have access until <strong>{endDate}</strong>.
        </Text>
        <Text style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>
          If you change your mind, you can resubscribe at any time.
        </Text>
        <Button
          href={shopUrl}
          style={{
            backgroundColor: "#000",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "14px",
          }}
        >
          Visit Shop
        </Button>
      </Section>
    </EmailLayout>
  );
}
