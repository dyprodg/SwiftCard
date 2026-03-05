import { describe, it, expect } from "vitest";
import { createPageSchema, updatePageSchema, pageFormSchema } from "../page";

describe("createPageSchema", () => {
  const validInput = {
    title: "About Us",
    type: "PAGE" as const,
    status: "DRAFT" as const,
    content: "<p>Welcome</p>",
    tags: [],
  };

  it("accepts valid minimal input and applies defaults", () => {
    const result = createPageSchema.safeParse({ title: "Hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("DRAFT");
      expect(result.data.type).toBe("PAGE");
      expect(result.data.tags).toEqual([]);
      expect(result.data.content).toBe("");
    }
  });

  it("accepts valid full input", () => {
    const result = createPageSchema.safeParse({
      ...validInput,
      slug: "about-us",
      metaTitle: "About | SwiftCard",
      metaDescription: "Learn more about us",
      tags: ["about", "company"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createPageSchema.safeParse({ ...validInput, title: "" });
    expect(result.success).toBe(false);
  });

  it("accepts BLOG type", () => {
    const result = createPageSchema.safeParse({ ...validInput, type: "BLOG" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid type", () => {
    const result = createPageSchema.safeParse({ ...validInput, type: "INVALID" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = createPageSchema.safeParse({ ...validInput, status: "LIVE" });
    expect(result.success).toBe(false);
  });

  it("transforms empty coverImageUrl to null", () => {
    const result = createPageSchema.safeParse({ ...validInput, coverImageUrl: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.coverImageUrl).toBeNull();
    }
  });

  it("keeps valid coverImageUrl", () => {
    const result = createPageSchema.safeParse({
      ...validInput,
      coverImageUrl: "https://example.com/image.jpg",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.coverImageUrl).toBe("https://example.com/image.jpg");
    }
  });

  it("rejects tags array exceeding 20 items", () => {
    const result = createPageSchema.safeParse({
      ...validInput,
      tags: Array.from({ length: 21 }, (_, i) => `tag${i}`),
    });
    expect(result.success).toBe(false);
  });

  it("accepts tags array with exactly 20 items", () => {
    const result = createPageSchema.safeParse({
      ...validInput,
      tags: Array.from({ length: 20 }, (_, i) => `tag${i}`),
    });
    expect(result.success).toBe(true);
  });
});

describe("slug validation", () => {
  const base = { title: "Test", type: "PAGE" as const };

  it("accepts valid slug", () => {
    const result = createPageSchema.safeParse({ ...base, slug: "my-page-123" });
    expect(result.success).toBe(true);
  });

  it("rejects slug with uppercase letters", () => {
    const result = createPageSchema.safeParse({ ...base, slug: "My-Page" });
    expect(result.success).toBe(false);
  });

  it("rejects slug with spaces", () => {
    const result = createPageSchema.safeParse({ ...base, slug: "my page" });
    expect(result.success).toBe(false);
  });

  it("rejects slug with underscores", () => {
    const result = createPageSchema.safeParse({ ...base, slug: "my_page" });
    expect(result.success).toBe(false);
  });

  it("rejects slug with special characters", () => {
    const result = createPageSchema.safeParse({ ...base, slug: "my/page" });
    expect(result.success).toBe(false);
  });

  it("accepts empty slug (optional)", () => {
    const result = createPageSchema.safeParse({ ...base, slug: "" });
    expect(result.success).toBe(true);
  });
});

describe("updatePageSchema", () => {
  it("requires id", () => {
    const result = updatePageSchema.safeParse({ title: "Updated" });
    expect(result.success).toBe(false);
  });

  it("accepts partial update with id", () => {
    const result = updatePageSchema.safeParse({ id: "page-1", title: "Updated" });
    expect(result.success).toBe(true);
  });

  it("accepts status-only update", () => {
    const result = updatePageSchema.safeParse({ id: "page-1", status: "PUBLISHED" });
    expect(result.success).toBe(true);
  });
});

describe("pageFormSchema", () => {
  it("validates form values", () => {
    const result = pageFormSchema.safeParse({
      type: "BLOG",
      title: "My Post",
      slug: "my-post",
      status: "DRAFT",
      content: "<p>Hello</p>",
      tags: ["news"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const result = pageFormSchema.safeParse({
      type: "BLOG",
      status: "DRAFT",
    });
    expect(result.success).toBe(false);
  });
});
