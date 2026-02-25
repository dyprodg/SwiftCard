"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { User, Package, MapPin, Shield, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { key: "overview" as const, href: "/account", icon: User },
  { key: "myOrders" as const, href: "/account/orders", icon: Package },
  { key: "subscriptions" as const, href: "/account/subscriptions", icon: RefreshCw },
  { key: "addresses" as const, href: "/account/addresses", icon: MapPin },
  { key: "data" as const, href: "/account/data", icon: Shield },
];

export function AccountNav({ locale }: { locale: string }) {
  const pathname = usePathname();
  const t = useTranslations("account.nav");

  return (
    <nav className="flex flex-row gap-1 md:w-56 md:flex-col">
      {navItems.map((item) => {
        const fullHref = `/${locale}${item.href}`;
        // Exact match for overview, prefix match for others
        const isActive =
          item.href === "/account"
            ? pathname === fullHref
            : pathname.startsWith(fullHref);

        return (
          <Link
            key={item.href}
            href={fullHref}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
