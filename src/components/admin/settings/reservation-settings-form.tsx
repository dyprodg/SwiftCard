"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { z } from "zod";

import { updateReservationSettings } from "@/server/actions/settings";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const schema = z.object({
  timeoutMinutes: z.number().min(5).max(60),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  defaultValues: FormValues;
};

export function ReservationSettingsForm({ defaultValues }: Props) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("admin.settings");
  const tr = useTranslations("admin.settings.reservationsForm");
  const tc = useTranslations("common");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  function onSubmit(data: FormValues) {
    startTransition(async () => {
      try {
        await updateReservationSettings(data);
        toast.success(t("saved"));
      } catch {
        toast.error(t("saveFailed"));
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tr("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="timeoutMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("timeoutLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={5}
                      max={60}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>{tr("timeoutDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
