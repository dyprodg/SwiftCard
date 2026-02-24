import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getMyAddresses } from "@/server/actions/addresses";
import { AddressesClient } from "./addresses-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return {
    title: t("addresses"),
    robots: { index: false, follow: false },
  };
}

export default async function AddressesPage() {
  const t = await getTranslations("account");
  const addresses = await getMyAddresses();

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">{t("addresses")}</h2>
      <AddressesClient initialAddresses={addresses} />
    </div>
  );
}
