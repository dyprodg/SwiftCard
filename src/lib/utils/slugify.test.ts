import { describe, it, expect } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases text", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("foo bar baz")).toBe("foo-bar-baz");
  });

  it("replaces German umlauts", () => {
    expect(slugify("Ärger öffnet Übermut")).toBe("aerger-oeffnet-uebermut");
  });

  it("replaces uppercase umlauts", () => {
    expect(slugify("ÄRGER ÖFFNET ÜBERMUT")).toBe("aerger-oeffnet-uebermut");
  });

  it("replaces ß with ss", () => {
    expect(slugify("Straße")).toBe("strasse");
  });

  it("removes special characters", () => {
    expect(slugify("hello! @world #2024")).toBe("hello-world-2024");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("handles numbers", () => {
    expect(slugify("Product 42")).toBe("product-42");
  });

  it("strips leading and trailing hyphens", () => {
    expect(slugify("--hello--")).toBe("hello");
  });

  it("collapses multiple spaces/underscores to single hyphen", () => {
    expect(slugify("hello   world__test")).toBe("hello-world-test");
  });

  it("trims whitespace", () => {
    expect(slugify("  hello  ")).toBe("hello");
  });

  it("handles mixed umlauts and special chars", () => {
    expect(slugify("Größe & Farbe!")).toBe("groesse-farbe");
  });
});
