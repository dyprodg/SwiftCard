import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { CookieBanner } from "@/components/storefront/cookie-banner";

type Props = {
  children: React.ReactNode;
};

export default function StorefrontLayout({ children }: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieBanner />
    </div>
  );
}
