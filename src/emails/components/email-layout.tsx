import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type EmailLayoutProps = {
  preview: string;
  children: React.ReactNode;
  shopName?: string;
};

export function EmailLayout({
  preview,
  children,
  shopName = "SwiftCart",
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>{shopName}</Text>
          </Section>
          {children}
          <Section style={footer}>
            <Text style={footerText}>{shopName} - Your trusted online store</Text>
            <Text style={footerText}>
              This is an automated email. Please do not reply directly.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  padding: "20px 40px",
  borderBottom: "1px solid #e6ebf1",
};

const logo = {
  fontSize: "24px",
  fontWeight: "bold" as const,
  color: "#1a1a1a",
  margin: "0",
};

const footer = {
  padding: "20px 40px",
  borderTop: "1px solid #e6ebf1",
};

const footerText = {
  fontSize: "12px",
  color: "#8898aa",
  margin: "4px 0",
};
