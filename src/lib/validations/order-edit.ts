import { z } from "zod";

export const editShippingAddressSchema = z.object({
  orderId: z.string().min(1),
  shippingName: z.string().min(1).max(200),
  shippingAddress1: z.string().min(1).max(500),
  shippingAddress2: z.string().max(500).optional().nullable(),
  shippingCity: z.string().min(1).max(200),
  shippingZip: z.string().min(1).max(20),
  shippingCountry: z.string().min(1).max(100),
});

export type EditShippingAddressInput = z.infer<typeof editShippingAddressSchema>;

export const editCustomerNoteSchema = z.object({
  orderId: z.string().min(1),
  customerNote: z.string().max(2000).optional().nullable(),
});

export type EditCustomerNoteInput = z.infer<typeof editCustomerNoteSchema>;

export const bulkStatusUpdateSchema = z.object({
  orderIds: z.array(z.string().min(1)).min(1).max(100),
  newStatus: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ]),
});

export type BulkStatusUpdateInput = z.infer<typeof bulkStatusUpdateSchema>;
