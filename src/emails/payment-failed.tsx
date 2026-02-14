import { Section, Text, Hr, Button } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

type PaymentFailedProps = {
  orderNumber: string;
  total: number;
  currency: string;
  orderViewUrl: string;
};

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("de-CH", { style: "currency", currency }).format(
    cents / 100,
  );
}

export function PaymentFailedEmail(props: PaymentFailedProps) {
  const { orderNumber, total, currency, orderViewUrl } = props;

  return (
    <EmailLayout preview={`Payment failed - ${orderNumber}`}>
      <Section style={content}>
        <Text style={heading}>Payment Failed</Text>
        <Text style={paragraph}>
          Unfortunately, the payment for your order could not be processed. Don&apos;t
          worry — your order has been saved and you can retry the payment at any time.
        </Text>
        <Text style={orderNumberStyle}>
          Order: <strong>{orderNumber}</strong>
        </Text>
        <Text style={orderNumberStyle}>
          Total: <strong>{formatAmount(total, currency)}</strong>
        </Text>

        <Hr style={hr} />

        <Text style={paragraph}>
          Click the button below to view your order and retry the payment.
        </Text>

        <Section style={buttonSection}>
          <Button style={button} href={orderViewUrl}>
            Retry Payment
          </Button>
        </Section>
      </Section>
    </EmailLayout>
  );
}

const content = { padding: "20px 40px" };
const heading = {
  fontSize: "24px",
  fontWeight: "bold" as const,
  color: "#1a1a1a",
  marginBottom: "8px",
};
const paragraph = { fontSize: "14px", color: "#525f7f", lineHeight: "24px" };
const orderNumberStyle = { fontSize: "14px", color: "#525f7f", marginBottom: "16px" };
const hr = { borderColor: "#e6ebf1", margin: "16px 0" };
const buttonSection = { textAlign: "center" as const, margin: "24px 0 8px" };
const button = {
  backgroundColor: "#dc2626",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600" as const,
  padding: "12px 24px",
  textDecoration: "none",
};
