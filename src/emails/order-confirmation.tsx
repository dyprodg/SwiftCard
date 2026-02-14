import { Section, Text, Row, Column, Hr } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

type OrderConfirmationProps = {
  orderNumber: string;
  items: {
    productName: string;
    variantName: string | null;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  shippingName: string;
  shippingAddress1: string;
  shippingAddress2: string | null;
  shippingCity: string;
  shippingZip: string;
  shippingCountry: string;
};

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("de-CH", { style: "currency", currency }).format(
    cents / 100,
  );
}

export function OrderConfirmationEmail(props: OrderConfirmationProps) {
  const {
    orderNumber,
    items,
    subtotal,
    tax,
    shipping,
    total,
    currency,
    shippingName,
    shippingAddress1,
    shippingAddress2,
    shippingCity,
    shippingZip,
    shippingCountry,
  } = props;

  return (
    <EmailLayout preview={`Order confirmed - ${orderNumber}`}>
      <Section style={content}>
        <Text style={heading}>Order Confirmed</Text>
        <Text style={paragraph}>
          Thank you for your order! Your payment has been received and your order is being
          processed.
        </Text>
        <Text style={orderNumberStyle}>
          Order: <strong>{orderNumber}</strong>
        </Text>

        <Hr style={hr} />

        {/* Order Items */}
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

        {/* Totals */}
        <Row style={totalRow}>
          <Column style={totalLabel}>
            <Text style={totalText}>Subtotal</Text>
          </Column>
          <Column style={totalValue}>
            <Text style={totalText}>{formatAmount(subtotal, currency)}</Text>
          </Column>
        </Row>
        <Row style={totalRow}>
          <Column style={totalLabel}>
            <Text style={totalText}>Shipping</Text>
          </Column>
          <Column style={totalValue}>
            <Text style={totalText}>
              {shipping === 0 ? "Free" : formatAmount(shipping, currency)}
            </Text>
          </Column>
        </Row>
        <Row style={totalRow}>
          <Column style={totalLabel}>
            <Text style={totalText}>Tax</Text>
          </Column>
          <Column style={totalValue}>
            <Text style={totalText}>{formatAmount(tax, currency)}</Text>
          </Column>
        </Row>
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

        {/* Shipping Address */}
        <Text style={sectionTitle}>Shipping Address</Text>
        <Text style={addressText}>
          {shippingName}
          <br />
          {shippingAddress1}
          {shippingAddress2 ? (
            <>
              <br />
              {shippingAddress2}
            </>
          ) : null}
          <br />
          {shippingZip} {shippingCity}
          <br />
          {shippingCountry}
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
const totalText = {
  fontSize: "14px",
  color: "#525f7f",
  margin: "0",
  textAlign: "right" as const,
};
const grandTotalText = {
  fontSize: "16px",
  fontWeight: "bold" as const,
  color: "#1a1a1a",
  margin: "0",
  textAlign: "right" as const,
};
const addressText = { fontSize: "14px", color: "#525f7f", lineHeight: "22px" };
