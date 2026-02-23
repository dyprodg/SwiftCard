import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { CookieBanner } from "@/components/storefront/cookie-banner";
import { EventBanner } from "@/components/storefront/event-banner";
import { AutoDiscountDetector } from "@/components/storefront/auto-discount-detector";

type Props = {
  children: React.ReactNode;
};

export default function StorefrontLayout({ children }: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <EventBanner />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieBanner />
      <AutoDiscountDetector />
    </div>
  );
}
