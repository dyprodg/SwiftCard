import { Section, Text, Link } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

type Props = {
  shopUrl: string;
};

export function NewsletterWelcomeEmail({ shopUrl }: Props) {
  return (
    <EmailLayout preview="Welcome to the SwiftCard newsletter!">
      <Section style={content}>
        <Text style={heading}>Welcome to SwiftCard!</Text>
        <Text style={paragraph}>
          Your subscription is confirmed. You&apos;ll be the first to know about new
          products, exclusive offers, and more.
        </Text>
        <Link href={shopUrl} style={ctaButton}>
          Browse Our Products
        </Link>
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
