import { describe, it, expect } from "vitest";
import { generateArticleJsonLd, organizationJsonLd, productJsonLd } from "../json-ld";

describe("generateArticleJsonLd", () => {
  const basePage = {
    title: "My Blog Post",
    slug: "my-blog-post",
    excerpt: "A short excerpt",
    coverImageUrl: "https://example.com/cover.jpg",
    publishedAt: new Date("2024-03-01T10:00:00Z"),
    updatedAt: new Date("2024-03-02T10:00:00Z"),
  };

  it("returns Article schema with correct @type", () => {
    const result = generateArticleJsonLd(basePage, "en", "https://example.com");
    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("Article");
  });

  it("includes headline from title", () => {
    const result = generateArticleJsonLd(basePage, "en", "https://example.com");
    expect(result.headline).toBe("My Blog Post");
  });

  it("includes description from excerpt", () => {
    const result = generateArticleJsonLd(basePage, "en", "https://example.com");
    expect(result.description).toBe("A short excerpt");
  });

  it("includes image URL", () => {
    const result = generateArticleJsonLd(basePage, "en", "https://example.com");
    expect(result.image).toEqual(["https://example.com/cover.jpg"]);
  });

  it("includes datePublished and dateModified", () => {
    const result = generateArticleJsonLd(basePage, "en", "https://example.com");
    expect(result.datePublished).toBe("2024-03-01T10:00:00.000Z");
    expect(result.dateModified).toBe("2024-03-02T10:00:00.000Z");
  });

  it("builds correct URL from appUrl, locale, and slug", () => {
    const result = generateArticleJsonLd(basePage, "de", "https://example.com");
    expect(result.url).toBe("https://example.com/de/blog/my-blog-post");
  });

  it("includes inLanguage from locale", () => {
    const result = generateArticleJsonLd(basePage, "de", "https://example.com");
    expect(result.inLanguage).toBe("de");
  });

  it("handles missing coverImageUrl (null)", () => {
    const result = generateArticleJsonLd(
      { ...basePage, coverImageUrl: null },
      "en",
      "https://example.com",
    );
    expect(result.image).toBeUndefined();
  });

  it("handles missing excerpt (null)", () => {
    const result = generateArticleJsonLd(
      { ...basePage, excerpt: null },
      "en",
      "https://example.com",
    );
    expect(result.description).toBeUndefined();
  });

  it("handles missing publishedAt (null)", () => {
    const result = generateArticleJsonLd(
      { ...basePage, publishedAt: null },
      "en",
      "https://example.com",
    );
    expect(result.datePublished).toBeUndefined();
  });
});

describe("organizationJsonLd", () => {
  it("returns Organization schema", () => {
    const result = organizationJsonLd("SwiftCard", "https://example.com");
    expect(result["@type"]).toBe("Organization");
    expect(result.name).toBe("SwiftCard");
    expect(result.url).toBe("https://example.com");
  });
});
