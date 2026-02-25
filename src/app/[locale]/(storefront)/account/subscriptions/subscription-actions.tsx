"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
} from "@/server/actions/subscriptions";

type Props = {
  subscriptionId: string;
  status: string;
};

export function SubscriptionActions({ subscriptionId, status }: Props) {
  const t = useTranslations("account.subscriptions");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleAction(action: (id: string) => Promise<void>, successMsg: string) {
    startTransition(async () => {
      try {
        await action(subscriptionId);
        toast.success(successMsg);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("error"));
      }
    });
  }

  if (status === "CANCELLED" || status === "EXPIRED") return null;

  return (
    <div className="flex gap-2 pt-2">
      {status === "ACTIVE" && (
        <>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleAction(pauseSubscription, t("paused"))}
          >
            {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            {t("pause")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={() => handleAction(cancelSubscription, t("cancelled"))}
          >
            {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            {t("cancel")}
          </Button>
        </>
      )}
      {status === "PAUSED" && (
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => handleAction(resumeSubscription, t("resumed"))}
        >
          {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
          {t("resume")}
        </Button>
      )}
      {status === "PAST_DUE" && (
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() => handleAction(cancelSubscription, t("cancelled"))}
        >
          {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
          {t("cancel")}
        </Button>
      )}
    </div>
  );
}
