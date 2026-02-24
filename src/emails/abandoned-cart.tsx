import { Section, Text, Link } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

type AbandonedCartProps = {
  items: { productName: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  currency: string;
  recoveryUrl: string;
};

export function AbandonedCartEmail({
  items,
  subtotal,
  currency,
  recoveryUrl,
}: AbandonedCartProps) {
  const formatPrice = (cents: number) => `${currency} ${(cents / 100).toFixed(2)}`;

  return (
    <EmailLayout preview="You left items in your cart — complete your order!">
      <Section style={content}>
        <Text style={heading}>You left something behind!</Text>
        <Text style={paragraph}>
          It looks like you didn&apos;t finish your purchase. Your items are still waiting
          for you.
        </Text>

        <Section style={itemsSection}>
          {items.map((item, i) => (
            <Text key={i} style={itemRow}>
              {item.productName} × {item.quantity} —{" "}
              {formatPrice(item.unitPrice * item.quantity)}
            </Text>
          ))}
          <Text style={totalRow}>Subtotal: {formatPrice(subtotal)}</Text>
        </Section>

        <Link href={recoveryUrl} style={ctaButton}>
          Complete Your Order
        </Link>

        <Text style={paragraph}>
          This link will restore your cart so you can pick up right where you left off.
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
const paragraph = {
  fontSize: "14px",
  color: "#525f7f",
  lineHeight: "24px",
};
const itemsSection = {
  backgroundColor: "#f6f9fc",
  borderRadius: "5px",
  padding: "16px",
  margin: "16px 0",
};
const itemRow = {
  fontSize: "14px",
  color: "#1a1a1a",
  margin: "4px 0",
};
const totalRow = {
  fontSize: "14px",
  fontWeight: "600" as const,
  color: "#1a1a1a",
  margin: "8px 0 0 0",
  borderTop: "1px solid #e6ebf1",
  paddingTop: "8px",
};
const ctaButton = {
  display: "inline-block",
  backgroundColor: "#1a1a1a",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "5px",
  fontSize: "14px",
  fontWeight: "600" as const,
  textDecoration: "none",
  marginTop: "8px",
  marginBottom: "16px",
};
