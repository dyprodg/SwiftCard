export const CARRIER_VALUES = ["POST", "DHL", "UPS", "OTHER"] as const;
export type Carrier = (typeof CARRIER_VALUES)[number];

export const CARRIER_LABELS: Record<Carrier, string> = {
  POST: "Swiss Post",
  DHL: "DHL",
  UPS: "UPS",
  OTHER: "Other",
};

const CARRIER_TRACKING_TEMPLATES: Record<string, string> = {
  POST: "https://service.post.ch/ekp-web/ui/entry/search/{trackingNumber}",
  DHL: "https://www.dhl.com/ch-en/home/tracking.html?tracking-id={trackingNumber}",
  UPS: "https://www.ups.com/track?tracknum={trackingNumber}",
};

export function buildTrackingUrl(
  carrier: string | null,
  trackingNumber: string | null,
): string | null {
  if (!carrier || !trackingNumber) return null;
  const template = CARRIER_TRACKING_TEMPLATES[carrier];
  if (!template) return null;
  return template.replace("{trackingNumber}", encodeURIComponent(trackingNumber));
}
