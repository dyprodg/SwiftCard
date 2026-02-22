import { Section, Text, Row, Column, Hr, Button } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

type OrderCreatedProps = {
  orderNumber: string;
  items: {
    productName: string;
    variantName: string | null;
    quantity: number;
    total: number;
  }[];
  total: number;
  currency: string;
  orderViewUrl: string;
};

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("de-CH", { style: "currency", currency }).format(
    cents / 100,
  );
}

export function OrderCreatedEmail(props: OrderCreatedProps) {
  const { orderNumber, items, total, currency, orderViewUrl } = props;

  return (
    <EmailLayout preview={`Order received - ${orderNumber}`}>
      <Section style={content}>
        <Text style={heading}>Order Received</Text>
        <Text style={paragraph}>
          Thank you for your order! We have received your order and are processing your
          payment.
        </Text>
        <Text style={orderNumberStyle}>
          Order: <strong>{orderNumber}</strong>
        </Text>

        <Hr style={hr} />

        <Text style={sectionTitle}>Items Ordered</Text>
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
const orderNumberStyle = { fontSize: "14px", color: "#525f7f", marginBottom: "16px" };
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
  fontSize: "14px",
  fontWeight: "600" as const,
  padding: "12px 24px",
  textDecoration: "none",
};
