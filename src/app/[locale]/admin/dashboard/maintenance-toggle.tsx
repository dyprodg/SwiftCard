"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type Props = {
  enabled: boolean;
  toggleAction: (enabled: boolean) => Promise<void>;
};

export function MaintenanceToggle({ enabled, toggleAction }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      try {
        await toggleAction(checked);
        toast.success(checked ? "Maintenance mode enabled" : "Maintenance mode disabled");
      } catch {
        toast.error("Failed to update maintenance mode");
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
      <Label htmlFor="maintenance" className="text-sm">
        Maintenance Mode
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
