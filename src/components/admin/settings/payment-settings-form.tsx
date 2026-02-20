"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  paymentSettingsSchema,
  type PaymentSettingsInput,
} from "@/lib/validations/settings";
import { updatePaymentSettings } from "@/server/actions/settings";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  defaultValues: PaymentSettingsInput;
};

export function PaymentSettingsForm({ defaultValues }: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<PaymentSettingsInput>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues,
  });

  function onSubmit(data: PaymentSettingsInput) {
    startTransition(async () => {
      try {
        await updatePaymentSettings(data);
        toast.success("Payment settings saved");
      } catch {
        toast.error("Failed to save settings");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CHF">CHF</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultTaxRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Tax Rate (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={
                        field.value !== undefined ? +(field.value * 100).toFixed(2) : ""
                      }
                      onChange={(e) => {
                        const pct = parseFloat(e.target.value);
                        field.onChange(isNaN(pct) ? 0 : pct / 100);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    e.g. 8.1 for Swiss VAT (stored as 0.081)
                  </FormDescription>
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
