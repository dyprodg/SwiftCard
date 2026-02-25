"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createCampaign,
  updateCampaign,
  sendCampaignNow,
} from "@/server/actions/newsletter";
import {
  campaignFormSchema,
  type CampaignFormValues,
} from "@/lib/validations/newsletter";
import type { EmailCampaign } from "@/types";

type Props = {
  campaign?: EmailCampaign;
};

export function CampaignForm({ campaign }: Props) {
  const t = useTranslations("admin.emailMarketing");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: campaign?.name ?? "",
      subject: campaign?.subject ?? "",
      previewText: campaign?.previewText ?? "",
      bodyHtml: campaign?.bodyHtml ?? "",
      segment: (campaign?.segment as CampaignFormValues["segment"]) ?? "all_subscribers",
      scheduledAt: "",
    },
  });

  async function onSubmit(data: CampaignFormValues) {
    startTransition(async () => {
      try {
        if (campaign) {
          await updateCampaign({
            id: campaign.id,
            ...data,
            scheduledAt: data.scheduledAt || undefined,
          });
          toast.success(t("saved"));
        } else {
          const result = await createCampaign({
            ...data,
            scheduledAt: data.scheduledAt || undefined,
          });
          toast.success(t("saved"));
          router.push(`/${locale}/admin/email-marketing/${result.id}`);
          return;
        }
        router.push(`/${locale}/admin/email-marketing`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("error"));
      }
    });
  }

  async function handleSendNow() {
    if (!campaign) return;
    startTransition(async () => {
      try {
        await sendCampaignNow(campaign.id);
        toast.success(t("sending"));
        router.push(`/${locale}/admin/email-marketing/${campaign.id}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("error"));
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("campaignDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("namePlaceholder")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("subject")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("subjectPlaceholder")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="previewText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("previewText")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="segment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("segment")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all_subscribers">
                        {t("segments.all_subscribers")}
                      </SelectItem>
                      <SelectItem value="customers_only">
                        {t("segments.customers_only")}
                      </SelectItem>
                      <SelectItem value="high_value">
                        {t("segments.high_value")}
                      </SelectItem>
                      <SelectItem value="recent_purchasers">
                        {t("segments.recent_purchasers")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("body")}</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="bodyHtml"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={12}
                      className="font-mono text-sm"
                      placeholder={t("bodyPlaceholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("scheduling")}</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="scheduledAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("scheduledAt")}</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("saveAsDraft")}
          </Button>
          {campaign &&
            (campaign.status === "DRAFT" || campaign.status === "SCHEDULED") && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleSendNow}
                disabled={isPending}
              >
                {t("sendNow")}
              </Button>
            )}
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/${locale}/admin/email-marketing`)}
          >
            {t("cancel")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
