"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

export function LocaleSwitcher() {
  const pathname = usePathname();
  const locale = useLocale();

  function buildHref(targetLocale: string) {
    // Replace only the first path segment (the locale)
    const segments = pathname.split("/");
    segments[1] = targetLocale;
    return segments.join("/");
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      {(["de", "en"] as const).map((l) => (
        <Link
          key={l}
          href={buildHref(l)}
          className={`rounded px-1.5 py-0.5 text-xs font-medium ${
            locale === l
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
