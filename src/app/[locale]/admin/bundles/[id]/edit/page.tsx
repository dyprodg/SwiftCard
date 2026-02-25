import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getBundleById } from "@/server/queries/bundles";
import { BundleForm } from "@/components/admin/bundle-form";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function EditBundlePage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("admin.bundles");
  const bundle = await getBundleById(id);

  if (!bundle) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("editTitle")}</h1>
        <p className="text-muted-foreground">{bundle.name}</p>
      </div>
      <BundleForm bundle={bundle} />
    </div>
  );
}
