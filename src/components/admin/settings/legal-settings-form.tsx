"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { legalSettingsSchema, type LegalSettingsInput } from "@/lib/validations/settings";
import { updateLegalSettings } from "@/server/actions/settings";

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

type Props = {
  defaultValues: LegalSettingsInput;
};

export function LegalSettingsForm({ defaultValues }: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<LegalSettingsInput>({
    resolver: zodResolver(legalSettingsSchema),
    defaultValues,
  });

  function onSubmit(data: LegalSettingsInput) {
    startTransition(async () => {
      try {
        await updateLegalSettings(data);
        toast.success("Legal settings saved");
      } catch {
        toast.error("Failed to save settings");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Legal Pages</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="termsUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms of Service URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://..."
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>Link to your terms page</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="privacyUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Privacy Policy URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://..."
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imprintUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imprint URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://..."
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
