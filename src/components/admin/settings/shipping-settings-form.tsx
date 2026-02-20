"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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

  const form = useForm<ShippingSettingsInput>({
    resolver: zodResolver(shippingSettingsSchema),
    defaultValues,
  });

  const hasFreeThreshold = form.watch("freeShippingThreshold") !== null;

  function onSubmit(data: ShippingSettingsInput) {
    startTransition(async () => {
      try {
        await updateShippingSettings(data);
        toast.success("Shipping settings saved");
      } catch {
        toast.error("Failed to save settings");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="defaultShippingCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Shipping Cost (cents)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>e.g. 990 = CHF 9.90</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Free Shipping Threshold</p>
                <p className="text-muted-foreground text-sm">
                  Waive shipping above a certain order total
                </p>
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
                    <FormLabel>Threshold (cents)</FormLabel>
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
                    <FormDescription>
                      e.g. 10000 = free shipping above CHF 100.00
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
