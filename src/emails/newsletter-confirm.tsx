import { Section, Text, Link } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

type Props = {
  confirmUrl: string;
};

export function NewsletterConfirmEmail({ confirmUrl }: Props) {
  return (
    <EmailLayout preview="Confirm your newsletter subscription">
      <Section style={content}>
        <Text style={heading}>Confirm Your Subscription</Text>
        <Text style={paragraph}>
          Thank you for signing up for the SwiftCard newsletter! Please confirm your email
          address by clicking the button below.
        </Text>
        <Link href={confirmUrl} style={ctaButton}>
          Confirm Subscription
        </Link>
        <Text style={paragraph}>
          If you did not sign up, you can safely ignore this email.
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
