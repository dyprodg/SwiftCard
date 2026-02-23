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

  return (
    <div className={`${bgColor} text-primary-foreground px-4 py-2 text-center text-sm`}>
      <span>{text}</span>
      {banner.linkUrl && linkText && (
        <>
          {" "}
          <Link href={banner.linkUrl} className="underline font-medium">
            {linkText}
          </Link>
        </>
      )}
    </div>
  );
}
