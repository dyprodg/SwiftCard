import { Section, Text, Row, Column, Hr, Button } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

type PaymentLinkEmailProps = {
  orderNumber: string;
  items: {
    productName: string;
    variantName: string | null;
    quantity: number;
    total: number;
  }[];
  total: number;
  currency: string;
  paymentUrl: string;
  expiresAt: Date;
  customMessage?: string;
  orderViewUrl?: string;
};

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("de-CH", { style: "currency", currency }).format(
    cents / 100,
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-CH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function PaymentLinkEmail(props: PaymentLinkEmailProps) {
  const { orderNumber, items, total, currency, paymentUrl, expiresAt, customMessage } =
    props;

  return (
    <EmailLayout preview={`Payment link for order ${orderNumber}`}>
      <Section style={content}>
        <Text style={heading}>Complete Your Payment</Text>
        <Text style={paragraph}>
          An order has been created for you. Please complete your payment using the link
          below.
        </Text>
        <Text style={orderNumberStyle}>
          Order: <strong>{orderNumber}</strong>
        </Text>

        {customMessage && (
          <>
            <Hr style={hr} />
            <Text style={messageStyle}>
              <em>&ldquo;{customMessage}&rdquo;</em>
            </Text>
          </>
        )}

        <Hr style={hr} />

        {/* Order Items */}
        <Text style={sectionTitle}>Order Summary</Text>
        {items.map((item, i) => (
          <Row key={i} style={itemRow}>
            <Column style={itemName}>
              <Text style={itemText}>
                {item.productName}
                {item.variantName ? ` - ${item.variantName}` : ""}
              </Text>
              <Text style={itemQty}>Qty: {item.quantity}</Text>
            </Column>
            <Column style={itemPrice}>
              <Text style={itemPriceText}>{formatAmount(item.total, currency)}</Text>
            </Column>
          </Row>
        ))}

        <Hr style={hr} />

        <Row style={totalRow}>
          <Column style={totalLabel}>
            <Text style={grandTotalText}>Total</Text>
          </Column>
          <Column style={totalValue}>
            <Text style={grandTotalText}>{formatAmount(total, currency)}</Text>
          </Column>
        </Row>

        <Hr style={hr} />

        <Section style={buttonSection}>
          <Button style={button} href={paymentUrl}>
            Pay Now
          </Button>
        </Section>

        <Text style={expiryText}>
          This payment link expires on {formatDate(expiresAt)}.
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
const orderNumberStyle = { fontSize: "14px", color: "#525f7f", marginBottom: "16px" };
const messageStyle = {
  fontSize: "14px",
  color: "#525f7f",
  lineHeight: "24px",
  padding: "8px 16px",
  backgroundColor: "#f8f9fa",
  borderRadius: "4px",
};
const hr = { borderColor: "#e6ebf1", margin: "16px 0" };
const sectionTitle = {
  fontSize: "16px",
  fontWeight: "600" as const,
  color: "#1a1a1a",
  marginBottom: "12px",
};
const itemRow = { marginBottom: "8px" };
const itemName = { width: "70%" };
const itemText = { fontSize: "14px", color: "#1a1a1a", margin: "0" };
const itemQty = { fontSize: "12px", color: "#8898aa", margin: "2px 0 0 0" };
const itemPrice = { width: "30%", textAlign: "right" as const };
const itemPriceText = {
  fontSize: "14px",
  color: "#1a1a1a",
  margin: "0",
  textAlign: "right" as const,
};
const totalRow = { marginBottom: "4px" };
const totalLabel = { width: "70%" };
const totalValue = { width: "30%", textAlign: "right" as const };
const grandTotalText = {
  fontSize: "16px",
  fontWeight: "bold" as const,
  color: "#1a1a1a",
  margin: "0",
  textAlign: "right" as const,
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
const expiryText = {
  fontSize: "12px",
  color: "#8898aa",
  textAlign: "center" as const,
  marginTop: "8px",
};
