import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { products, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getDiscountById } from "@/server/queries/discounts";
import { DiscountForm } from "@/components/admin/discount-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditDiscountPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("admin.discounts");

  const [discount, allProducts, allCategories] = await Promise.all([
    getDiscountById(id),
    db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(eq(products.status, "ACTIVE")),
    db.select({ id: categories.id, name: categories.name }).from(categories),
  ]);

  if (!discount) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("editDiscount")}</h1>
        <p className="text-muted-foreground">{t("editDescription")}</p>
      </div>
      <DiscountForm
        discount={discount}
        products={allProducts}
        categories={allCategories}
      />
    </div>
  );
}
