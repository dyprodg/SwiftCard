import { describe, it, expect, beforeEach } from "vitest";
import { useCookieConsentStore } from "./cookie-store";

describe("cookie-store", () => {
  beforeEach(() => {
    useCookieConsentStore.setState({ consent: null, showBanner: false });
  });

  describe("acceptAll", () => {
    it("sets analytics to true", () => {
      useCookieConsentStore.getState().acceptAll();
      const { consent } = useCookieConsentStore.getState();
      expect(consent?.essential).toBe(true);
      expect(consent?.analytics).toBe(true);
    });

    it("hides the banner", () => {
      useCookieConsentStore.setState({ showBanner: true });
      useCookieConsentStore.getState().acceptAll();
      expect(useCookieConsentStore.getState().showBanner).toBe(false);
    });
  });

  describe("acceptEssential", () => {
    it("sets analytics to false", () => {
      useCookieConsentStore.getState().acceptEssential();
      const { consent } = useCookieConsentStore.getState();
      expect(consent?.essential).toBe(true);
      expect(consent?.analytics).toBe(false);
    });

    it("hides the banner", () => {
      useCookieConsentStore.setState({ showBanner: true });
      useCookieConsentStore.getState().acceptEssential();
      expect(useCookieConsentStore.getState().showBanner).toBe(false);
    });
  });

  describe("openSettings", () => {
    it("shows the banner", () => {
      useCookieConsentStore.getState().openSettings();
      expect(useCookieConsentStore.getState().showBanner).toBe(true);
    });
  });

  describe("state transitions", () => {
    it("openSettings then acceptAll hides banner and sets analytics", () => {
      useCookieConsentStore.getState().openSettings();
      expect(useCookieConsentStore.getState().showBanner).toBe(true);

      useCookieConsentStore.getState().acceptAll();
      expect(useCookieConsentStore.getState().showBanner).toBe(false);
      expect(useCookieConsentStore.getState().consent?.analytics).toBe(true);
    });

    it("acceptEssential then acceptAll upgrades consent", () => {
      useCookieConsentStore.getState().acceptEssential();
      expect(useCookieConsentStore.getState().consent?.analytics).toBe(false);

      useCookieConsentStore.getState().acceptAll();
      expect(useCookieConsentStore.getState().consent?.analytics).toBe(true);
    });
  });
});
