import { Section, Text, Hr, Button } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

type ReturnApprovedEmailProps = {
  orderNumber: string;
  items: {
    productName: string;
    variantName: string | null;
    quantity: number;
  }[];
  orderViewUrl: string;
};

export function ReturnApprovedEmail(props: ReturnApprovedEmailProps) {
  const { orderNumber, items, orderViewUrl } = props;

  return (
    <EmailLayout preview={`Return approved for order ${orderNumber}`}>
      <Section style={content}>
        <Text style={heading}>Return Request Approved</Text>
        <Text style={paragraph}>
          Your return request for order <strong>{orderNumber}</strong> has been approved.
          Please send the following items back to us:
        </Text>

        <Hr style={hr} />

        <Text style={sectionTitle}>Items to Return</Text>
        {items.map((item, i) => (
          <Text key={i} style={itemText}>
            {item.quantity}x {item.productName}
            {item.variantName ? ` - ${item.variantName}` : ""}
          </Text>
        ))}

        <Hr style={hr} />

        <Text style={sectionTitle}>Shipping Instructions</Text>
        <Text style={paragraph}>
          1. Pack items securely in their original packaging if possible.
        </Text>
        <Text style={paragraph}>
          2. Include your order number <strong>{orderNumber}</strong> inside the package.
        </Text>
        <Text style={paragraph}>
          3. Use tracked shipping to ensure your return is delivered safely.
        </Text>

        <Hr style={hr} />

        <Section style={buttonSection}>
          <Button style={button} href={orderViewUrl}>
            View Order
          </Button>
        </Section>

        <Text style={footerText}>
          Once we receive your return, we will process your refund promptly.
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
const sectionTitle = {
  fontSize: "16px",
  fontWeight: "600" as const,
  color: "#1a1a1a",
  marginBottom: "8px",
};
const itemText = {
  fontSize: "14px",
  color: "#1a1a1a",
  margin: "4px 0",
  paddingLeft: "8px",
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
const footerText = {
  fontSize: "12px",
  color: "#8898aa",
  textAlign: "center" as const,
  marginTop: "8px",
};
