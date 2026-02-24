import { Section, Text, Hr, Button } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

type ReturnRejectedEmailProps = {
  orderNumber: string;
  rejectionReason: string;
  orderViewUrl: string;
};

export function ReturnRejectedEmail(props: ReturnRejectedEmailProps) {
  const { orderNumber, rejectionReason, orderViewUrl } = props;

  return (
    <EmailLayout preview={`Return request for order ${orderNumber} was not approved`}>
      <Section style={content}>
        <Text style={heading}>Return Request Update</Text>
        <Text style={paragraph}>
          Your return request for order <strong>{orderNumber}</strong> could not be
          approved.
        </Text>

        <Hr style={hr} />

        <Text style={sectionTitle}>Reason</Text>
        <Text style={reasonBox}>{rejectionReason}</Text>

        <Hr style={hr} />

        <Text style={paragraph}>
          If you have any questions, please contact our support team.
        </Text>

        <Section style={buttonSection}>
          <Button style={button} href={orderViewUrl}>
            View Order
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
const hr = { borderColor: "#e6ebf1", margin: "16px 0" };
const sectionTitle = {
  fontSize: "16px",
  fontWeight: "600" as const,
  color: "#1a1a1a",
  marginBottom: "8px",
};
const reasonBox = {
  fontSize: "14px",
  color: "#525f7f",
  lineHeight: "24px",
  padding: "12px 16px",
  backgroundColor: "#f8f9fa",
  borderRadius: "4px",
};
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
