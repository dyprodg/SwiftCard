import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { User, Package, MapPin, Shield } from "lucide-react";
import { AccountNav } from "./account-nav";

type Props = {
  children: React.ReactNode;
};

export default async function AccountLayout({ children }: Props) {
  const { userId } = await auth();
  const locale = await getLocale();

  if (!userId) {
    redirect(`/${locale}/sign-in`);
  }

  const t = await getTranslations("account");

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>
      <div className="flex flex-col gap-8 md:flex-row">
        <AccountNav locale={locale} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
