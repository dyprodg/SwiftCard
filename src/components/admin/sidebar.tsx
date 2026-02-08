"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
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
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Settings", href: "/admin/settings/general", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const locale = useLocale();

  return (
    <aside className="bg-muted/40 flex w-64 flex-col border-r">
      <div className="flex h-14 items-center border-b px-4">
        <Link href={`/${locale}`} className="flex items-center gap-2 font-semibold">
          <Store className="h-5 w-5" />
          <span>SwiftCart Admin</span>
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
              {item.label}
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
          View Storefront
        </Link>
      </div>
    </aside>
  );
}
