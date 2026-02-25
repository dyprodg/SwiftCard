import { describe, it, expect } from "vitest";
import {
  subscribeNewsletterSchema,
  createCampaignSchema,
  updateCampaignSchema,
  importSubscribersSchema,
  campaignFormSchema,
} from "../newsletter";

describe("subscribeNewsletterSchema", () => {
  it("accepts valid email with default source", () => {
    const result = subscribeNewsletterSchema.safeParse({
      email: "user@example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.source).toBe("footer");
    }
  });

  it("accepts valid email with explicit source", () => {
    const result = subscribeNewsletterSchema.safeParse({
      email: "user@example.com",
      source: "popup",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.source).toBe("popup");
    }
  });

  it("accepts checkout source", () => {
    const result = subscribeNewsletterSchema.safeParse({
      email: "user@example.com",
      source: "checkout",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.source).toBe("checkout");
    }
  });

  it("rejects invalid email", () => {
    const result = subscribeNewsletterSchema.safeParse({
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = subscribeNewsletterSchema.safeParse({
      email: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = subscribeNewsletterSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects invalid source", () => {
    const result = subscribeNewsletterSchema.safeParse({
      email: "user@example.com",
      source: "unknown",
    });
    expect(result.success).toBe(false);
  });
});

describe("createCampaignSchema", () => {
  const validCampaign = {
    name: "Summer Sale",
    subject: "Don't miss our Summer Sale!",
    bodyHtml: "<h1>Summer Sale</h1><p>Up to 50% off</p>",
    segment: "all_subscribers" as const,
  };

  it("accepts valid campaign with required fields", () => {
    const result = createCampaignSchema.safeParse(validCampaign);
    expect(result.success).toBe(true);
  });

  it("accepts valid campaign with all optional fields", () => {
    const result = createCampaignSchema.safeParse({
      ...validCampaign,
      previewText: "Up to 50% off everything",
      bodyJson: '{"type":"doc"}',
      scheduledAt: "2026-06-01T10:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const { name, ...rest } = validCampaign;
    const result = createCampaignSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = createCampaignSchema.safeParse({
      ...validCampaign,
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding 200 characters", () => {
    const result = createCampaignSchema.safeParse({
      ...validCampaign,
      name: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing subject", () => {
    const { subject, ...rest } = validCampaign;
    const result = createCampaignSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects empty subject", () => {
    const result = createCampaignSchema.safeParse({
      ...validCampaign,
      subject: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects subject exceeding 200 characters", () => {
    const result = createCampaignSchema.safeParse({
      ...validCampaign,
      subject: "s".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing bodyHtml", () => {
    const { bodyHtml, ...rest } = validCampaign;
    const result = createCampaignSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects empty bodyHtml", () => {
    const result = createCampaignSchema.safeParse({
      ...validCampaign,
      bodyHtml: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing segment", () => {
    const { segment, ...rest } = validCampaign;
    const result = createCampaignSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid segment", () => {
    const result = createCampaignSchema.safeParse({
      ...validCampaign,
      segment: "vip_only",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid segments", () => {
    const segments = [
      "all_subscribers",
      "customers_only",
      "high_value",
      "recent_purchasers",
    ];
    for (const segment of segments) {
      const result = createCampaignSchema.safeParse({
        ...validCampaign,
        segment,
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts valid ISO datetime for scheduledAt", () => {
    const result = createCampaignSchema.safeParse({
      ...validCampaign,
      scheduledAt: "2026-12-25T08:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid datetime for scheduledAt", () => {
    const result = createCampaignSchema.safeParse({
      ...validCampaign,
      scheduledAt: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("rejects previewText exceeding 200 characters", () => {
    const result = createCampaignSchema.safeParse({
      ...validCampaign,
      previewText: "p".repeat(201),
    });
    expect(result.success).toBe(false);
  });
});

describe("updateCampaignSchema", () => {
  it("requires id", () => {
    const result = updateCampaignSchema.safeParse({
      name: "Updated Name",
    });
    expect(result.success).toBe(false);
  });

  it("accepts id with no other fields", () => {
    const result = updateCampaignSchema.safeParse({
      id: "campaign-1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty id", () => {
    const result = updateCampaignSchema.safeParse({
      id: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts partial update with name only", () => {
    const result = updateCampaignSchema.safeParse({
      id: "campaign-1",
      name: "Updated Name",
    });
    expect(result.success).toBe(true);
  });

  it("accepts partial update with subject only", () => {
    const result = updateCampaignSchema.safeParse({
      id: "campaign-1",
      subject: "New Subject Line",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all fields at once", () => {
    const result = updateCampaignSchema.safeParse({
      id: "campaign-1",
      name: "Updated Name",
      subject: "Updated Subject",
      previewText: "Updated preview",
      bodyHtml: "<p>Updated body</p>",
      bodyJson: '{"updated":true}',
      segment: "high_value",
      scheduledAt: "2026-07-01T12:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null previewText (to clear it)", () => {
    const result = updateCampaignSchema.safeParse({
      id: "campaign-1",
      previewText: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts null scheduledAt (to unschedule)", () => {
    const result = updateCampaignSchema.safeParse({
      id: "campaign-1",
      scheduledAt: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = updateCampaignSchema.safeParse({
      id: "campaign-1",
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding 200 characters", () => {
    const result = updateCampaignSchema.safeParse({
      id: "campaign-1",
      name: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty bodyHtml", () => {
    const result = updateCampaignSchema.safeParse({
      id: "campaign-1",
      bodyHtml: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid segment", () => {
    const result = updateCampaignSchema.safeParse({
      id: "campaign-1",
      segment: "premium",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid scheduledAt format", () => {
    const result = updateCampaignSchema.safeParse({
      id: "campaign-1",
      scheduledAt: "tomorrow",
    });
    expect(result.success).toBe(false);
  });
});

describe("importSubscribersSchema", () => {
  it("accepts array with valid emails", () => {
    const result = importSubscribersSchema.safeParse({
      emails: ["a@example.com", "b@example.com", "c@example.com"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts single email", () => {
    const result = importSubscribersSchema.safeParse({
      emails: ["solo@example.com"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty array", () => {
    const result = importSubscribersSchema.safeParse({
      emails: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing emails field", () => {
    const result = importSubscribersSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects array with invalid email", () => {
    const result = importSubscribersSchema.safeParse({
      emails: ["valid@example.com", "not-valid"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects array where all emails are invalid", () => {
    const result = importSubscribersSchema.safeParse({
      emails: ["bad", "worse", "worst"],
    });
    expect(result.success).toBe(false);
  });
});

describe("campaignFormSchema", () => {
  const validForm = {
    name: "Newsletter Q1",
    subject: "Your Q1 Update",
    bodyHtml: "<p>Hello subscribers!</p>",
    segment: "all_subscribers" as const,
  };

  it("accepts valid form with required fields", () => {
    const result = campaignFormSchema.safeParse(validForm);
    expect(result.success).toBe(true);
  });

  it("accepts valid form with all optional fields", () => {
    const result = campaignFormSchema.safeParse({
      ...validForm,
      previewText: "Read about our latest news",
      scheduledAt: "2026-03-15T09:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const { name, ...rest } = validForm;
    const result = campaignFormSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = campaignFormSchema.safeParse({
      ...validForm,
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing subject", () => {
    const { subject, ...rest } = validForm;
    const result = campaignFormSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects empty subject", () => {
    const result = campaignFormSchema.safeParse({
      ...validForm,
      subject: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing bodyHtml", () => {
    const { bodyHtml, ...rest } = validForm;
    const result = campaignFormSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects empty bodyHtml", () => {
    const result = campaignFormSchema.safeParse({
      ...validForm,
      bodyHtml: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing segment", () => {
    const { segment, ...rest } = validForm;
    const result = campaignFormSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid segment", () => {
    const result = campaignFormSchema.safeParse({
      ...validForm,
      segment: "invalid_segment",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid segments", () => {
    const segments = [
      "all_subscribers",
      "customers_only",
      "high_value",
      "recent_purchasers",
    ];
    for (const segment of segments) {
      const result = campaignFormSchema.safeParse({
        ...validForm,
        segment,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects name exceeding 200 characters", () => {
    const result = campaignFormSchema.safeParse({
      ...validForm,
      name: "n".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects subject exceeding 200 characters", () => {
    const result = campaignFormSchema.safeParse({
      ...validForm,
      subject: "s".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects previewText exceeding 200 characters", () => {
    const result = campaignFormSchema.safeParse({
      ...validForm,
      previewText: "p".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("does not include bodyJson field", () => {
    const result = campaignFormSchema.safeParse({
      ...validForm,
      bodyJson: '{"type":"doc"}',
    });
    // bodyJson is not part of campaignFormSchema, so it should be stripped
    expect(result.success).toBe(true);
    if (result.success) {
      expect("bodyJson" in result.data).toBe(false);
    }
  });

  it("accepts scheduledAt as plain string (not datetime-validated)", () => {
    // campaignFormSchema uses z.string().optional() for scheduledAt (no .datetime())
    const result = campaignFormSchema.safeParse({
      ...validForm,
      scheduledAt: "some-string",
    });
    expect(result.success).toBe(true);
  });
});
