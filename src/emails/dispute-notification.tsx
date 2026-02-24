import { Section, Text, Link } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

type DisputeNotificationProps = {
  orderNumber: string;
  disputeAmount: number;
  currency: string;
  reason: string;
  customerEmail: string;
  adminUrl: string;
};

export function DisputeNotificationEmail({
  orderNumber,
  disputeAmount,
  currency,
  reason,
  customerEmail,
  adminUrl,
}: DisputeNotificationProps) {
  const formatPrice = (cents: number) => `${currency} ${(cents / 100).toFixed(2)}`;

  return (
    <EmailLayout preview={`Payment dispute opened for order ${orderNumber}`}>
      <Section style={content}>
        <Text style={heading}>Payment Dispute Opened</Text>
        <Text style={paragraph}>
          A payment dispute has been opened for order <strong>{orderNumber}</strong>.
          Immediate action may be required.
        </Text>

        <Section style={detailsSection}>
          <Text style={detailRow}>Order: {orderNumber}</Text>
          <Text style={detailRow}>Customer: {customerEmail}</Text>
          <Text style={detailRow}>Disputed Amount: {formatPrice(disputeAmount)}</Text>
          <Text style={detailRow}>Reason: {reason}</Text>
        </Section>

        <Link href={adminUrl} style={ctaButton}>
          View Order in Admin
        </Link>

        <Text style={paragraph}>
          You should respond to this dispute in your Stripe Dashboard as soon as possible.
          Failing to respond may result in the dispute being resolved in the
          customer&apos;s favor.
        </Text>
      </Section>
    </EmailLayout>
  );
}

const content = { padding: "20px 40px" };
const heading = {
  fontSize: "24px",
  fontWeight: "bold" as const,
  color: "#dc2626",
  marginBottom: "8px",
};
const paragraph = {
  fontSize: "14px",
  color: "#525f7f",
  lineHeight: "24px",
};
const detailsSection = {
  backgroundColor: "#fef2f2",
  borderRadius: "5px",
  padding: "16px",
  margin: "16px 0",
  border: "1px solid #fecaca",
};
const detailRow = {
  fontSize: "14px",
  color: "#1a1a1a",
  margin: "4px 0",
};
const ctaButton = {
  display: "inline-block",
  backgroundColor: "#dc2626",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "5px",
  fontSize: "14px",
  fontWeight: "600" as const,
  textDecoration: "none",
  marginTop: "8px",
};
