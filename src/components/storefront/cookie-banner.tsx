"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { useCookieConsentStore } from "@/stores/cookie-store";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function CookieBanner() {
  const t = useTranslations("cookie");
  const { consent, showBanner, acceptAll, acceptEssential } = useCookieConsentStore();

  // Avoid hydration mismatch — returns false on server, true on client
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!mounted) return null;
  if (consent !== null && !showBanner) return null;

  return (
    <div className="bg-background fixed inset-x-0 bottom-0 z-50 border-t p-4 shadow-lg">
      <div className="container mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl space-y-1">
          <h3 className="text-sm font-semibold">{t("title")}</h3>
          <p className="text-muted-foreground text-sm">{t("message")}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={acceptEssential}>
            {t("acceptEssential")}
          </Button>
          <Button size="sm" onClick={acceptAll}>
            {t("acceptAll")}
          </Button>
        </div>
      </div>
    </div>
  );
}
