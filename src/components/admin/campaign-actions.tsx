"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  sendCampaignNow,
  cancelCampaign,
  deleteCampaign,
} from "@/server/actions/newsletter";
import type { EmailCampaign } from "@/types";

export function CampaignActions({ campaign }: { campaign: EmailCampaign }) {
  const t = useTranslations("admin.emailMarketing");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handle(action: () => Promise<void>, successMsg: string) {
    startTransition(async () => {
      try {
        await action();
        toast.success(successMsg);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("error"));
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {(campaign.status === "DRAFT" || campaign.status === "SCHEDULED") && (
        <>
          <Button variant="outline" size="sm" asChild>
            <a href={`/${locale}/admin/email-marketing/${campaign.id}/edit`}>
              {t("editCampaign")}
            </a>
          </Button>
          <Button
            size="sm"
            onClick={() => handle(() => sendCampaignNow(campaign.id), t("sending"))}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("sendNow")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handle(() => cancelCampaign(campaign.id), t("cancelled"))}
            disabled={isPending}
          >
            {t("cancel")}
          </Button>
        </>
      )}
      {campaign.status === "DRAFT" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            handle(async () => {
              await deleteCampaign(campaign.id);
              router.push(`/${locale}/admin/email-marketing`);
            }, t("deleted"))
          }
          disabled={isPending}
        >
          {t("delete")}
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(`/${locale}/admin/email-marketing`)}
      >
        {t("backToList")}
      </Button>
    </div>
  );
}
