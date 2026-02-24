"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { updateEventBanner } from "@/server/actions/settings";

const bannerFormSchema = z.object({
  enabled: z.boolean(),
  textEn: z.string().max(200),
  textDe: z.string().max(200),
  linkUrl: z.string().max(500),
  linkTextEn: z.string().max(100),
  linkTextDe: z.string().max(100),
  bgColor: z.string().max(50),
});

type BannerFormValues = z.infer<typeof bannerFormSchema>;

export default function BannerSettingsPage() {
  const t = useTranslations("admin.settings");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: {
      enabled: false,
      textEn: "",
      textDe: "",
      linkUrl: "",
      linkTextEn: "",
      linkTextDe: "",
      bgColor: "bg-primary",
    },
  });

  function onSubmit(values: BannerFormValues) {
    startTransition(async () => {
      try {
        await updateEventBanner(values);
        toast.success(t("saved"));
      } catch {
        toast.error(t("saveFailed"));
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("bannerForm.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormLabel>{t("bannerForm.enabled")}</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="textEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("bannerForm.textEn")}</FormLabel>
                    <FormControl>
                      <Input placeholder="Summer Sale - 20% off everything!" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="textDe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("bannerForm.textDe")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Sommerschlussverkauf - 20% auf alles!"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="linkUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("bannerForm.linkUrl")}</FormLabel>
                  <FormControl>
                    <Input placeholder="/products" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="linkTextEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("bannerForm.linkTextEn")}</FormLabel>
                    <FormControl>
                      <Input placeholder="Shop now" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkTextDe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("bannerForm.linkTextDe")}</FormLabel>
                    <FormControl>
                      <Input placeholder="Jetzt kaufen" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bgColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("bannerForm.bgColor")}</FormLabel>
                  <FormControl>
                    <Input placeholder="bg-primary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={isPending}>
          {isPending ? tc("updating") : tc("saveChanges")}
        </Button>
      </form>
    </Form>
  );
}
