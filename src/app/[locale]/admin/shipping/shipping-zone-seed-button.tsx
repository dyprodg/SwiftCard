"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { seedDefaultShippingZones } from "@/server/actions/shipping";

export function ShippingZoneSeedButton() {
  const t = useTranslations("admin.shipping");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          try {
            const result = await seedDefaultShippingZones();
            toast.success(t("seedSuccess").replace("{count}", String(result.created)));
            router.refresh();
          } catch {
            toast.error(t("error"));
          }
        });
      }}
    >
      {t("seedDefaults")}
    </Button>
  );
}
