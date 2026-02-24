import { Section, Text, Hr, Button } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

type ReturnReceivedEmailProps = {
  orderNumber: string;
  orderViewUrl: string;
};

export function ReturnReceivedEmail(props: ReturnReceivedEmailProps) {
  const { orderNumber, orderViewUrl } = props;

  return (
    <EmailLayout preview={`Return received for order ${orderNumber}`}>
      <Section style={content}>
        <Text style={heading}>Return Received</Text>
        <Text style={paragraph}>
          We have received your returned items for order <strong>{orderNumber}</strong>.
          Your return is now being processed and your refund will be issued shortly.
        </Text>

        <Hr style={hr} />

        <Section style={buttonSection}>
          <Button style={button} href={orderViewUrl}>
            View Order
          </Button>
        </Section>

        <Text style={footerText}>
          You will receive a separate notification once your refund has been processed.
        </Text>
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
const hr = { borderColor: "#e6ebf1", margin: "16px 0" };
const buttonSection = { textAlign: "center" as const, margin: "24px 0 8px" };
const button = {
  backgroundColor: "#1a1a1a",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600" as const,
  padding: "14px 32px",
  textDecoration: "none",
};
const footerText = {
  fontSize: "12px",
  color: "#8898aa",
  textAlign: "center" as const,
  marginTop: "8px",
};
