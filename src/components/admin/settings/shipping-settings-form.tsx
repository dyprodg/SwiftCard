"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import {
  shippingSettingsSchema,
  type ShippingSettingsInput,
} from "@/lib/validations/settings";
import { updateShippingSettings } from "@/server/actions/settings";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  defaultValues: ShippingSettingsInput;
};

export function ShippingSettingsForm({ defaultValues }: Props) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("admin.settings");
  const tf = useTranslations("admin.settings.shippingForm");
  const tc = useTranslations("common");

  const form = useForm<ShippingSettingsInput>({
    resolver: zodResolver(shippingSettingsSchema),
    defaultValues,
  });

  const hasFreeThreshold = form.watch("freeShippingThreshold") !== null;

  function onSubmit(data: ShippingSettingsInput) {
    startTransition(async () => {
      try {
        await updateShippingSettings(data);
        toast.success(t("saved"));
      } catch {
        toast.error(t("saveFailed"));
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tf("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="defaultShippingCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tf("defaultCost")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>{tf("defaultCostHint")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">{tf("freeThreshold")}</p>
                <p className="text-muted-foreground text-sm">{tf("freeThresholdHint")}</p>
              </div>
              <Switch
                checked={hasFreeThreshold}
                onCheckedChange={(checked) => {
                  form.setValue("freeShippingThreshold", checked ? 10000 : null, {
                    shouldDirty: true,
                  });
                }}
              />
            </div>

            {hasFreeThreshold && (
              <FormField
                control={form.control}
                name="freeShippingThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tf("thresholdAmount")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? null : Number(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>{tf("thresholdAmountHint")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
