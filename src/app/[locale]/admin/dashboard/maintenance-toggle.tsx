"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type Props = {
  enabled: boolean;
  toggleAction: (enabled: boolean) => Promise<void>;
};

export function MaintenanceToggle({ enabled, toggleAction }: Props) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("admin.dashboard");

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      try {
        await toggleAction(checked);
        toast.success(checked ? t("maintenanceEnabled") : t("maintenanceDisabled"));
      } catch {
        toast.error(t("maintenanceFailed"));
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
      <Label htmlFor="maintenance" className="text-sm">
        {t("maintenanceMode")}
      </Label>
      <Switch
        id="maintenance"
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={isPending}
      />
    </div>
  );
}
