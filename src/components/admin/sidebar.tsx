"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { key: "dashboard" as const, href: "/admin/dashboard", icon: LayoutDashboard },
  { key: "products" as const, href: "/admin/products", icon: Package },
  { key: "orders" as const, href: "/admin/orders", icon: ShoppingCart },
  { key: "customers" as const, href: "/admin/customers", icon: Users },
  { key: "settings" as const, href: "/admin/settings/general", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("admin.nav");

  return (
    <aside className="bg-muted/40 flex w-64 flex-col border-r">
      <div className="flex h-14 items-center border-b px-4">
        <Link href={`/${locale}`} className="flex items-center gap-2 font-semibold">
          <Store className="h-5 w-5" />
          <span>{t("adminTitle")}</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const fullHref = `/${locale}/${item.href.replace(/^\//, "")}`;
          const isActive = pathname.startsWith(fullHref);

          return (
            <Link
              key={item.href}
              href={fullHref}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
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
      <div className="border-t p-4">
        <Link
          href={`/${locale}`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm"
        >
          <Store className="h-4 w-4" />
          {t("viewStorefront")}
        </Link>
      </div>
    </aside>
  );
}
