"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { z } from "zod";

import { updateFeatureFlags } from "@/server/actions/settings";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({
  bundles: z.boolean(),
  giftCards: z.boolean(),
  subscriptions: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  defaultValues: FormValues;
};

export function FeatureFlagsForm({ defaultValues }: Props) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("admin.settings");
  const tf = useTranslations("admin.settings.featuresForm");
  const tc = useTranslations("common");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  function onSubmit(data: FormValues) {
    startTransition(async () => {
      try {
        await updateFeatureFlags(data);
        toast.success(t("saved"));
      } catch {
        toast.error(t("saveFailed"));
      }
    });
  }

  const features = [
    {
      name: "bundles" as const,
      label: tf("bundlesLabel"),
      description: tf("bundlesDescription"),
    },
    {
      name: "giftCards" as const,
      label: tf("giftCardsLabel"),
      description: tf("giftCardsDescription"),
    },
    {
      name: "subscriptions" as const,
      label: tf("subscriptionsLabel"),
      description: tf("subscriptionsDescription"),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tf("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {features.map((feature) => (
              <FormField
                key={feature.name}
                control={form.control}
                name={feature.name}
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel>{feature.label}</FormLabel>
                      <FormDescription>{feature.description}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}

            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tc("saveChanges")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
