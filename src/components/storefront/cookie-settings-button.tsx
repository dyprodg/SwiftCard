"use client";

import { useCookieConsentStore } from "@/stores/cookie-store";

export function CookieSettingsButton({ label }: { label: string }) {
  const openSettings = useCookieConsentStore((s) => s.openSettings);

  return (
    <button
      onClick={openSettings}
      className="text-muted-foreground hover:text-foreground text-left text-sm transition-colors"
    >
      {label}
    </button>
  );
}
