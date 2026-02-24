import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { CheckoutClient } from "./checkout-client";
import { getMyAddresses } from "@/server/actions/addresses";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout");
  return {
    title: t("title"),
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage() {
  const t = await getTranslations("checkout");
  const { userId } = await auth();

  // Load saved addresses and user email for logged-in users
  let savedAddresses: Awaited<ReturnType<typeof getMyAddresses>> = [];
  let userEmail: string | null = null;

  if (userId) {
    const [addresses, user] = await Promise.all([getMyAddresses(), currentUser()]);
    savedAddresses = addresses;
    userEmail = user?.emailAddresses[0]?.emailAddress ?? null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">{t("title")}</h1>
      <CheckoutClient
        savedAddresses={savedAddresses}
        userEmail={userEmail}
        isLoggedIn={!!userId}
      />
    </div>
  );
}
