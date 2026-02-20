type Translation = { locale: string; name: string; description: string | null };

/**
 * Takes a product with its `translations` relation and a locale,
 * returns the product with localized `name` and `description`.
 * Falls back to the base fields if no translation exists for the locale.
 *
 * Uses `Record<string, any>` constraint to work with Drizzle's inferred types.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function localizeProduct<T extends Record<string, any>>(
  product: T,
  locale: string,
): T {
  const translations = product.translations as Translation[] | undefined;
  const translation = translations?.find((t) => t.locale === locale);
  if (!translation) return product;

  return {
    ...product,
    name: translation.name || product.name,
    description: translation.description ?? product.description,
  } as T;
}

/**
 * Localizes an array of products.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function localizeProducts<T extends Record<string, any>>(
  products: T[],
  locale: string,
): T[] {
  return products.map((p) => localizeProduct(p, locale));
}
