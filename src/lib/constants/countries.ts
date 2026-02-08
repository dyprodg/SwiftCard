/**
 * European shipping countries (common for Swiss e-commerce).
 * Code is ISO 3166-1 alpha-2.
 */
export const SHIPPING_COUNTRIES = [
  { code: "CH", name: "Switzerland", nameDe: "Schweiz" },
  { code: "DE", name: "Germany", nameDe: "Deutschland" },
  { code: "AT", name: "Austria", nameDe: "Österreich" },
  { code: "FR", name: "France", nameDe: "Frankreich" },
  { code: "IT", name: "Italy", nameDe: "Italien" },
  { code: "LI", name: "Liechtenstein", nameDe: "Liechtenstein" },
  { code: "NL", name: "Netherlands", nameDe: "Niederlande" },
  { code: "BE", name: "Belgium", nameDe: "Belgien" },
  { code: "LU", name: "Luxembourg", nameDe: "Luxemburg" },
  { code: "ES", name: "Spain", nameDe: "Spanien" },
  { code: "PT", name: "Portugal", nameDe: "Portugal" },
  { code: "GB", name: "United Kingdom", nameDe: "Vereinigtes Königreich" },
  { code: "SE", name: "Sweden", nameDe: "Schweden" },
  { code: "DK", name: "Denmark", nameDe: "Dänemark" },
  { code: "NO", name: "Norway", nameDe: "Norwegen" },
  { code: "FI", name: "Finland", nameDe: "Finnland" },
  { code: "PL", name: "Poland", nameDe: "Polen" },
  { code: "CZ", name: "Czech Republic", nameDe: "Tschechien" },
] as const;

export type ShippingCountryCode = (typeof SHIPPING_COUNTRIES)[number]["code"];
