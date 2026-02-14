import { Section, Text, Link } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

type OrderShippedProps = {
  orderNumber: string;
  shippingName: string;
  trackingNumber?: string;
  trackingUrl?: string;
};

export function OrderShippedEmail({
  orderNumber,
  shippingName,
  trackingNumber,
  trackingUrl,
}: OrderShippedProps) {
  return (
    <EmailLayout preview={`Your order ${orderNumber} has been shipped!`}>
      <Section style={content}>
        <Text style={heading}>Your Order Has Been Shipped!</Text>
        <Text style={paragraph}>
          Hi {shippingName}, great news! Your order <strong>{orderNumber}</strong> is on
          its way.
        </Text>

        {trackingNumber && (
          <>
            <Text style={sectionTitle}>Tracking Information</Text>
            <Text style={paragraph}>
              Tracking Number: <strong>{trackingNumber}</strong>
            </Text>
            {trackingUrl && (
              <Link href={trackingUrl} style={trackingLink}>
                Track your package
              </Link>
            )}
          </>
        )}

        <Text style={paragraph}>
          If you have any questions about your order, please contact our support team.
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
const sectionTitle = {
  fontSize: "16px",
  fontWeight: "600" as const,
  color: "#1a1a1a",
  marginBottom: "8px",
};
const trackingLink = {
  display: "inline-block",
  backgroundColor: "#1a1a1a",
  color: "#ffffff",
  padding: "10px 20px",
  borderRadius: "5px",
  fontSize: "14px",
  fontWeight: "600" as const,
  textDecoration: "none",
  marginTop: "8px",
};
