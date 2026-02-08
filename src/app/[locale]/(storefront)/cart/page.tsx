import { getTranslations } from "next-intl/server";
import { CartPageClient } from "./cart-client";

export default async function CartPage() {
  const t = await getTranslations("cart");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">{t("title")}</h1>
      <CartPageClient />
    </div>
  );
}
