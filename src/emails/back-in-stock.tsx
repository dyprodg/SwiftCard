import { Section, Text, Link } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

type BackInStockProps = {
  productName: string;
  productUrl: string;
  variantName?: string;
};

export function BackInStockEmail({
  productName,
  productUrl,
  variantName,
}: BackInStockProps) {
  return (
    <EmailLayout preview={`${productName} is back in stock!`}>
      <Section style={content}>
        <Text style={heading}>Good News! It&apos;s Back in Stock</Text>
        <Text style={paragraph}>
          The product you were waiting for is available again:
        </Text>
        <Text style={productTitle}>
          {productName}
          {variantName && <span style={variantLabel}> — {variantName}</span>}
        </Text>
        <Link href={productUrl} style={ctaButton}>
          Shop Now
        </Link>
        <Text style={paragraph}>
          Don&apos;t wait too long — popular items sell out fast!
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
const productTitle = {
  fontSize: "18px",
  fontWeight: "600" as const,
  color: "#1a1a1a",
  margin: "16px 0",
};
const variantLabel = {
  fontWeight: "normal" as const,
  color: "#525f7f",
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
  marginBottom: "16px",
};
