"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { MapPin, Plus, Star, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddressFormDialog } from "@/components/storefront/address-form-dialog";
import {
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/server/actions/addresses";
import type { CustomerAddress } from "@/types";
import type { AddressFormValues } from "@/lib/validations/address";

type Props = {
  initialAddresses: CustomerAddress[];
};

export function AddressesClient({ initialAddresses }: Props) {
  const t = useTranslations("account.addressBook");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function handleCreate(data: AddressFormValues) {
    await createAddress(data);
    setShowForm(false);
    startTransition(() => router.refresh());
  }

  async function handleUpdate(data: AddressFormValues) {
    if (!editingAddress) return;
    await updateAddress(editingAddress.id, data);
    setEditingAddress(null);
    startTransition(() => router.refresh());
  }

  async function handleDelete() {
    if (!deleteId) return;
    await deleteAddress(deleteId);
    setDeleteId(null);
    startTransition(() => router.refresh());
  }

  async function handleSetDefault(id: string) {
    await setDefaultAddress(id);
    startTransition(() => router.refresh());
  }

  return (
    <>
      {initialAddresses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <MapPin className="text-muted-foreground mb-3 h-10 w-10" />
            <p className="text-muted-foreground mb-4 text-sm">{t("empty")}</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("add")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4">
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {t("add")}
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {initialAddresses.map((address) => (
              <Card key={address.id} className="relative">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-sm font-semibold">{address.label}</span>
                    {address.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="mr-1 h-3 w-3" />
                        {t("default")}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">{address.name}</p>
                    {address.company && (
                      <p className="text-muted-foreground">{address.company}</p>
                    )}
                    <p>{address.address1}</p>
                    {address.address2 && <p>{address.address2}</p>}
                    <p>
                      {address.zip} {address.city}
                    </p>
                    <p>{address.country}</p>
                    {address.phone && (
                      <p className="text-muted-foreground mt-1">{address.phone}</p>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingAddress(address)}
                    >
                      <Pencil className="mr-1 h-3 w-3" />
                      {t("edit")}
                    </Button>
                    {!address.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                        disabled={isPending}
                      >
                        <Star className="mr-1 h-3 w-3" />
                        {t("setDefault")}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(address.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Add Address Dialog */}
      <AddressFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleCreate}
        title={t("add")}
      />

      {/* Edit Address Dialog */}
      <AddressFormDialog
        open={!!editingAddress}
        onOpenChange={(open) => !open && setEditingAddress(null)}
        onSubmit={handleUpdate}
        title={t("edit")}
        defaultValues={
          editingAddress
            ? {
                label: editingAddress.label,
                name: editingAddress.name,
                phone: editingAddress.phone ?? "",
                company: editingAddress.company ?? "",
                address1: editingAddress.address1,
                address2: editingAddress.address2 ?? "",
                city: editingAddress.city,
                zip: editingAddress.zip,
                country: editingAddress.country,
                isDefault: editingAddress.isDefault,
              }
            : undefined
        }
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open: boolean) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
