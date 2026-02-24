import { db, type Database } from "@/db";
import { orderEvents } from "@/db/schema/order-events";

type OrderEventInput = {
  orderId: string;
  type: (typeof orderEvents.type.enumValues)[number];
  data?: Record<string, unknown>;
  createdBy?: string | null;
};

/** Log an order event (standalone, outside a transaction) */
export async function logOrderEvent(input: OrderEventInput) {
  await db.insert(orderEvents).values({
    orderId: input.orderId,
    type: input.type,
    data: input.data ?? null,
    createdBy: input.createdBy ?? null,
  });
}

/** Log an order event inside an existing DB transaction */
export async function logOrderEventTx(
  tx: Parameters<Parameters<Database["transaction"]>[0]>[0],
  input: OrderEventInput,
) {
  await tx.insert(orderEvents).values({
    orderId: input.orderId,
    type: input.type,
    data: input.data ?? null,
    createdBy: input.createdBy ?? null,
  });
}
