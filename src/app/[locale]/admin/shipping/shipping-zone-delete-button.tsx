"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteShippingZone } from "@/server/actions/shipping";

export function ShippingZoneDeleteButton({ zoneId }: { zoneId: string }) {
  const t = useTranslations("admin.shipping");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      className="text-destructive hover:text-destructive"
      onClick={() => {
        if (!confirm(t("deleteConfirm"))) return;
        startTransition(async () => {
          try {
            await deleteShippingZone(zoneId);
            toast.success(t("deleted"));
            router.refresh();
          } catch {
            toast.error(t("error"));
          }
        });
      }}
    >
      <Trash2 className="h-3 w-3" />
    </Button>
  );
}
