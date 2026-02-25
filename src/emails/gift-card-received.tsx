import { Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

type GiftCardReceivedProps = {
  recipientName: string;
  senderName: string;
  code: string;
  amount: string;
  personalMessage?: string;
  expiresAt?: string;
};

export function GiftCardReceivedEmail({
  recipientName,
  senderName,
  code,
  amount,
  personalMessage,
  expiresAt,
}: GiftCardReceivedProps) {
  return (
    <EmailLayout preview={`You received a ${amount} gift card from ${senderName}!`}>
      <Section style={content}>
        <Text style={heading}>You received a Gift Card!</Text>
        <Text style={paragraph}>
          Hi {recipientName}, {senderName} sent you a SwiftCard gift card worth{" "}
          <strong>{amount}</strong>.
        </Text>

        {personalMessage && (
          <Section style={messageBox}>
            <Text style={messageLabel}>Personal message:</Text>
            <Text style={messageText}>&ldquo;{personalMessage}&rdquo;</Text>
          </Section>
        )}

        <Text style={paragraph}>Your gift card code:</Text>
        <Section style={codeBox}>
          <Text style={codeText}>{code}</Text>
        </Section>

        <Text style={paragraph}>
          Enter this code at checkout to redeem your gift card.
        </Text>

        {expiresAt && <Text style={footnote}>Valid until {expiresAt}.</Text>}
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
const messageBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
};
const messageLabel = {
  fontSize: "12px",
  color: "#9ca3af",
  marginBottom: "4px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};
const messageText = {
  fontSize: "14px",
  color: "#374151",
  fontStyle: "italic" as const,
  margin: "0",
};
const codeBox = {
  backgroundColor: "#1a1a1a",
  borderRadius: "8px",
  padding: "20px",
  textAlign: "center" as const,
  margin: "16px 0",
};
const codeText = {
  fontSize: "24px",
  fontWeight: "bold" as const,
  color: "#ffffff",
  fontFamily: "monospace",
  letterSpacing: "2px",
  margin: "0",
};
const footnote = {
  fontSize: "12px",
  color: "#9ca3af",
  marginTop: "16px",
};
