import Link from "next/link";
import { getLocale } from "next-intl/server";
import { getEventBanner } from "@/lib/edge-config";

export async function EventBanner() {
  const banner = await getEventBanner();
  if (!banner) return null;

  const locale = await getLocale();
  const text = locale === "de" ? banner.textDe : banner.textEn;
  const linkText = locale === "de" ? banner.linkTextDe : banner.linkTextEn;
  const bgColor = banner.bgColor || "bg-primary";

  const separator = " \u2022 ";
  const segment = banner.linkUrl && linkText ? `${text} — ${linkText}` : text;
  // Repeat enough times to fill wide screens seamlessly
  const repeated = Array(12).fill(segment).join(separator) + separator;

  return (
    <div className={`${bgColor} text-primary-foreground overflow-hidden py-2 text-sm`}>
      <div className="animate-marquee flex whitespace-nowrap">
        <span className="inline-block min-w-full">
          {banner.linkUrl ? (
            <Link href={banner.linkUrl} className="hover:underline">
              {repeated}
            </Link>
          ) : (
            repeated
          )}
        </span>
        <span className="inline-block min-w-full" aria-hidden>
          {banner.linkUrl ? (
            <Link href={banner.linkUrl} className="hover:underline" tabIndex={-1}>
              {repeated}
            </Link>
          ) : (
            repeated
          )}
        </span>
      </div>
    </div>
  );
}
