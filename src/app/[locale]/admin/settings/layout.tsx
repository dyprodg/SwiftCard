"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const tabKeys = [
  "general",
  "shipping",
  "payment",
  "legal",
  "banner",
  "reservations",
] as const;
const tabHrefs: Record<string, string> = {
  general: "/admin/settings/general",
  shipping: "/admin/settings/shipping",
  payment: "/admin/settings/payment",
  legal: "/admin/settings/legal",
  banner: "/admin/settings/banner",
  reservations: "/admin/settings/reservations",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("admin.settings");

  return (
    <div>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground mt-1 mb-6">{t("description")}</p>
      <nav className="mb-6 flex gap-1 border-b">
        {tabKeys.map((key) => {
          const fullHref = `/${locale}${tabHrefs[key]}`;
          const isActive = pathname === fullHref;
          return (
            <Link
              key={key}
              href={fullHref}
              className={cn(
                "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {t(key)}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
