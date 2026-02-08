import { getTranslations } from "next-intl/server";
import { CheckoutClient } from "./checkout-client";

export default async function CheckoutPage() {
  const t = await getTranslations("checkout");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">{t("title")}</h1>
      <CheckoutClient />
    </div>
  );
}
