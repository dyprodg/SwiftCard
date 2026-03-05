import type { PageWithTranslations } from "@/types";

/**
 * Returns the localized fields for a page, falling back to the primary-language
 * fields when no translation exists for the requested locale.
 */
export function localizePage(page: PageWithTranslations, locale: string) {
  const translation = page.translations.find((t) => t.locale === locale);
  return {
    title: translation?.title ?? page.title,
    content: translation?.content ?? page.content,
    excerpt: translation?.excerpt ?? page.excerpt,
    metaTitle: translation?.metaTitle ?? page.metaTitle,
    metaDescription: translation?.metaDescription ?? page.metaDescription,
  };
}
