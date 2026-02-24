"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { customerAddresses } from "@/db/schema/customer-profiles";
import { eq, and } from "drizzle-orm";
import { addressSchema } from "@/lib/validations/address";
import { updateTag } from "next/cache";

export async function getMyAddresses() {
  const { userId } = await auth();
  if (!userId) return [];

  return db
    .select()
    .from(customerAddresses)
    .where(eq(customerAddresses.userId, userId))
    .orderBy(customerAddresses.createdAt);
}

export async function getDefaultAddress() {
  const { userId } = await auth();
  if (!userId) return null;

  const [address] = await db
    .select()
    .from(customerAddresses)
    .where(
      and(eq(customerAddresses.userId, userId), eq(customerAddresses.isDefault, true)),
    );

  return address ?? null;
}

export async function createAddress(input: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const data = addressSchema.parse(input);

  // If setting as default, unset any existing default
  if (data.isDefault) {
    await db
      .update(customerAddresses)
      .set({ isDefault: false })
      .where(
        and(eq(customerAddresses.userId, userId), eq(customerAddresses.isDefault, true)),
      );
  }

  // If this is the first address, make it default
  const existing = await db
    .select({ id: customerAddresses.id })
    .from(customerAddresses)
    .where(eq(customerAddresses.userId, userId))
    .limit(1);

  const isFirst = existing.length === 0;

  const [address] = await db
    .insert(customerAddresses)
    .values({
      userId,
      label: data.label,
      name: data.name,
      phone: data.phone || null,
      company: data.company || null,
      address1: data.address1,
      address2: data.address2 || null,
      city: data.city,
      zip: data.zip,
      country: data.country,
      isDefault: data.isDefault || isFirst,
    })
    .returning();

  updateTag("addresses");
  return address;
}

export async function updateAddress(id: string, input: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const data = addressSchema.parse(input);

  // Verify ownership
  const [existing] = await db
    .select()
    .from(customerAddresses)
    .where(and(eq(customerAddresses.id, id), eq(customerAddresses.userId, userId)));

  if (!existing) throw new Error("Address not found");

  // If setting as default, unset others
  if (data.isDefault && !existing.isDefault) {
    await db
      .update(customerAddresses)
      .set({ isDefault: false })
      .where(
        and(eq(customerAddresses.userId, userId), eq(customerAddresses.isDefault, true)),
      );
  }

  const [address] = await db
    .update(customerAddresses)
    .set({
      label: data.label,
      name: data.name,
      phone: data.phone || null,
      company: data.company || null,
      address1: data.address1,
      address2: data.address2 || null,
      city: data.city,
      zip: data.zip,
      country: data.country,
      isDefault: data.isDefault ?? existing.isDefault,
    })
    .where(and(eq(customerAddresses.id, id), eq(customerAddresses.userId, userId)))
    .returning();

  updateTag("addresses");
  return address;
}

export async function deleteAddress(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const [deleted] = await db
    .delete(customerAddresses)
    .where(and(eq(customerAddresses.id, id), eq(customerAddresses.userId, userId)))
    .returning();

  if (!deleted) throw new Error("Address not found");

  // If we deleted the default address, promote the first remaining address
  if (deleted.isDefault) {
    const [first] = await db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.userId, userId))
      .orderBy(customerAddresses.createdAt)
      .limit(1);

    if (first) {
      await db
        .update(customerAddresses)
        .set({ isDefault: true })
        .where(eq(customerAddresses.id, first.id));
    }
  }

  updateTag("addresses");
  return deleted;
}

export async function setDefaultAddress(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  // Verify ownership
  const [address] = await db
    .select()
    .from(customerAddresses)
    .where(and(eq(customerAddresses.id, id), eq(customerAddresses.userId, userId)));

  if (!address) throw new Error("Address not found");

  // Unset existing default
  await db
    .update(customerAddresses)
    .set({ isDefault: false })
    .where(
      and(eq(customerAddresses.userId, userId), eq(customerAddresses.isDefault, true)),
    );

  // Set new default
  await db
    .update(customerAddresses)
    .set({ isDefault: true })
    .where(eq(customerAddresses.id, id));

  updateTag("addresses");
}

/**
 * Save an address from checkout if user opts in.
 * Called after successful order creation for logged-in users.
 */
export async function saveAddressFromCheckout(data: {
  name: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  zip: string;
  country: string;
}) {
  const { userId } = await auth();
  if (!userId) return;

  // Check if this address already exists (dedupe by address1 + zip + city)
  const existing = await db
    .select()
    .from(customerAddresses)
    .where(eq(customerAddresses.userId, userId));

  const isDuplicate = existing.some(
    (a) =>
      a.address1.toLowerCase() === data.address1.toLowerCase() &&
      a.zip === data.zip &&
      a.city.toLowerCase() === data.city.toLowerCase(),
  );

  if (isDuplicate) return;

  const isFirst = existing.length === 0;

  await db.insert(customerAddresses).values({
    userId,
    label: isFirst ? "Home" : `Address ${existing.length + 1}`,
    name: data.name,
    phone: data.phone || null,
    address1: data.address1,
    address2: data.address2 || null,
    city: data.city,
    zip: data.zip,
    country: data.country,
    isDefault: isFirst,
  });

  updateTag("addresses");
}
