import Link from "next/link";
import { Store } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "./locale-switcher";
import { CookieSettingsButton } from "./cookie-settings-button";
import { NewsletterFooterForm } from "./newsletter-footer-form";
import { getShopSettings } from "@/lib/edge-config";

export async function Footer() {
  const locale = await getLocale();
  const t = await getTranslations("footer");
  const settings = await getShopSettings();

  return (
    <footer className="bg-muted/40 border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <Store className="h-5 w-5" />
              <span>{settings.shopName}</span>
            </div>
            {settings.shopDescription && (
              <p className="text-muted-foreground text-sm">{settings.shopDescription}</p>
            )}
          </div>

          {/* Legal Links */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">{t("legal")}</h3>
            <nav className="flex flex-col gap-1">
              <Link
                href={`/${locale}/terms`}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {t("terms")}
              </Link>
              <Link
                href={`/${locale}/privacy`}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {t("privacy")}
              </Link>
              <Link
                href={`/${locale}/imprint`}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {t("imprint")}
              </Link>
              <Link
                href={`/${locale}/account/data`}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {t("gdpr")}
              </Link>
              <CookieSettingsButton label={t("cookieSettings")} />
            </nav>
          </div>

          {/* Newsletter */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">{t("newsletter")}</h3>
            <p className="text-muted-foreground text-sm">{t("newsletterDescription")}</p>
            <NewsletterFooterForm />
          </div>

          {/* Copyright + Locale */}
          <div className="flex flex-col items-start gap-4 md:items-end">
            <LocaleSwitcher />
            <p className="text-muted-foreground text-xs">
              &copy; {new Date().getFullYear()} {settings.shopName}. {t("copyright")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
