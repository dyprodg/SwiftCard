import { getTranslations } from "next-intl/server";
import { BundleForm } from "@/components/admin/bundle-form";

export default async function NewBundlePage() {
  const t = await getTranslations("admin.bundles");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("create")}</h1>
        <p className="text-muted-foreground">{t("createDescription")}</p>
      </div>
      <BundleForm />
    </div>
  );
}
