"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "General", href: "/admin/settings/general" },
  { label: "Shipping", href: "/admin/settings/shipping" },
  { label: "Payment", href: "/admin/settings/payment" },
  { label: "Legal", href: "/admin/settings/legal" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const locale = useLocale();

  return (
    <div>
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="text-muted-foreground mt-1 mb-6">Manage your shop configuration</p>
      <nav className="mb-6 flex gap-1 border-b">
        {tabs.map((tab) => {
          const fullHref = `/${locale}${tab.href}`;
          const isActive = pathname === fullHref;
          return (
            <Link
              key={tab.href}
              href={fullHref}
              className={cn(
                "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
