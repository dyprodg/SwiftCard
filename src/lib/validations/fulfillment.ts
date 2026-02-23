import { z } from "zod";
import { CARRIER_VALUES } from "@/lib/constants/carriers";

const fulfillmentItemSchema = z.object({
  orderItemId: z.string().min(1),
  quantity: z.number().int().min(1),
});

export const fulfillmentSchema = z
  .object({
    orderId: z.string().min(1),
    carrier: z.enum(CARRIER_VALUES).nullable().optional(),
    carrierOther: z.string().optional(),
    trackingNumber: z.string().optional(),
    trackingUrl: z.string().url().optional().or(z.literal("")),
    note: z.string().optional(),
    items: z.array(fulfillmentItemSchema).min(1),
  })
  .refine(
    (data) => {
      if (data.carrier === "OTHER" && !data.carrierOther?.trim()) {
        return false;
      }
      return true;
    },
    {
      message: "Carrier name is required when carrier is OTHER",
      path: ["carrierOther"],
    },
  );

export type FulfillmentInput = z.infer<typeof fulfillmentSchema>;
