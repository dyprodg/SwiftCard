import Link from "next/link";
import { Store, User, ClipboardList } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { getLocale, getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { CartSheet } from "./cart-sheet";

export async function Header() {
  const locale = await getLocale();
  const t = await getTranslations("common");

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2 font-bold">
          <Store className="h-5 w-5" />
          <span>SwiftCart</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href={`/${locale}/products`}
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            {t("products")}
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Locale Switcher */}
          <div className="flex items-center gap-1 text-sm">
            <Link
              href={`/de`}
              className={`rounded px-1.5 py-0.5 text-xs font-medium ${locale === "de" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              DE
            </Link>
            <Link
              href={`/en`}
              className={`rounded px-1.5 py-0.5 text-xs font-medium ${locale === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              EN
            </Link>
          </div>

          {/* Cart Sheet (client component with badge) */}
          <CartSheet locale={locale} />

          {/* Auth */}
          <SignedIn>
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/${locale}/account/orders`}>
                <ClipboardList className="h-5 w-5" />
                <span className="sr-only">{t("account")}</span>
              </Link>
            </Button>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/${locale}/sign-in`}>
                <User className="h-5 w-5" />
                <span className="sr-only">{t("signIn")}</span>
              </Link>
            </Button>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
