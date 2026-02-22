"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type CookieConsent = {
  essential: true;
  analytics: boolean;
};

type CookieConsentState = {
  consent: CookieConsent | null;
  showBanner: boolean;
};

type CookieConsentActions = {
  acceptAll: () => void;
  acceptEssential: () => void;
  openSettings: () => void;
};

type CookieConsentStore = CookieConsentState & CookieConsentActions;

export const useCookieConsentStore = create<CookieConsentStore>()(
  persist(
    (set) => ({
      consent: null,
      showBanner: false,

      acceptAll: () =>
        set({
          consent: { essential: true, analytics: true },
          showBanner: false,
        }),

      acceptEssential: () =>
        set({
          consent: { essential: true, analytics: false },
          showBanner: false,
        }),

      openSettings: () => set({ showBanner: true }),
    }),
    {
      name: "swiftcard-cookie-consent",
      partialize: (state) => ({ consent: state.consent }),
    },
  ),
);
