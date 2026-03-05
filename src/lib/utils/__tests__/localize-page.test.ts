import { describe, it, expect } from "vitest";
import { localizePage } from "../localize-page";
import type { PageWithTranslations } from "@/types";

function makePage(overrides: Partial<PageWithTranslations> = {}): PageWithTranslations {
  return {
    id: "page-1",
    slug: "test-page",
    type: "PAGE",
    status: "PUBLISHED",
    title: "Primary Title",
    content: "<p>Primary Content</p>",
    excerpt: "Primary excerpt",
    coverImageUrl: null,
    metaTitle: "Primary Meta Title",
    metaDescription: "Primary meta description",
    authorId: null,
    tags: [],
    publishedAt: new Date("2024-01-01"),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    translations: [],
    ...overrides,
  };
}

describe("localizePage", () => {
  it("returns primary-language fields when no translations exist", () => {
    const page = makePage();
    const result = localizePage(page, "de");

    expect(result.title).toBe("Primary Title");
    expect(result.content).toBe("<p>Primary Content</p>");
    expect(result.excerpt).toBe("Primary excerpt");
    expect(result.metaTitle).toBe("Primary Meta Title");
    expect(result.metaDescription).toBe("Primary meta description");
  });

  it("returns translation fields when locale matches", () => {
    const page = makePage({
      translations: [
        {
          id: "t1",
          pageId: "page-1",
          locale: "de",
          title: "Deutscher Titel",
          content: "<p>Deutscher Inhalt</p>",
          excerpt: "Deutscher Auszug",
          metaTitle: "DE Meta Titel",
          metaDescription: "DE Meta Beschreibung",
        },
      ],
    });

    const result = localizePage(page, "de");

    expect(result.title).toBe("Deutscher Titel");
    expect(result.content).toBe("<p>Deutscher Inhalt</p>");
    expect(result.excerpt).toBe("Deutscher Auszug");
    expect(result.metaTitle).toBe("DE Meta Titel");
    expect(result.metaDescription).toBe("DE Meta Beschreibung");
  });

  it("falls back to primary when locale does not match any translation", () => {
    const page = makePage({
      translations: [
        {
          id: "t1",
          pageId: "page-1",
          locale: "fr",
          title: "Titre Français",
          content: "<p>Contenu</p>",
          excerpt: "Extrait",
          metaTitle: null,
          metaDescription: null,
        },
      ],
    });

    const result = localizePage(page, "de");

    expect(result.title).toBe("Primary Title");
    expect(result.content).toBe("<p>Primary Content</p>");
  });

  it("falls back to primary for fields not provided in translation (null)", () => {
    const page = makePage({
      translations: [
        {
          id: "t1",
          pageId: "page-1",
          locale: "de",
          title: "Deutscher Titel",
          content: null,
          excerpt: null,
          metaTitle: null,
          metaDescription: null,
        },
      ],
    });

    const result = localizePage(page, "de");

    expect(result.title).toBe("Deutscher Titel");
    expect(result.content).toBe("<p>Primary Content</p>");
    expect(result.excerpt).toBe("Primary excerpt");
    expect(result.metaTitle).toBe("Primary Meta Title");
    expect(result.metaDescription).toBe("Primary meta description");
  });

  it("handles missing excerpt gracefully (null on page)", () => {
    const page = makePage({ excerpt: null, translations: [] });
    const result = localizePage(page, "en");
    expect(result.excerpt).toBeNull();
  });

  it("handles missing metaTitle gracefully (null on page)", () => {
    const page = makePage({ metaTitle: null, translations: [] });
    const result = localizePage(page, "en");
    expect(result.metaTitle).toBeNull();
  });

  it("selects the correct translation when multiple locales present", () => {
    const page = makePage({
      translations: [
        {
          id: "t1",
          pageId: "page-1",
          locale: "de",
          title: "Deutsch",
          content: null,
          excerpt: null,
          metaTitle: null,
          metaDescription: null,
        },
        {
          id: "t2",
          pageId: "page-1",
          locale: "fr",
          title: "Français",
          content: null,
          excerpt: null,
          metaTitle: null,
          metaDescription: null,
        },
      ],
    });

    expect(localizePage(page, "de").title).toBe("Deutsch");
    expect(localizePage(page, "fr").title).toBe("Français");
    expect(localizePage(page, "en").title).toBe("Primary Title");
  });
});
