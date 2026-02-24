"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomerAddress } from "@/types";

type Props = {
  addresses: CustomerAddress[];
  onSelect: (address: CustomerAddress) => void;
};

export function AddressSelector({ addresses, onSelect }: Props) {
  const t = useTranslations("checkout");

  if (addresses.length === 0) return null;

  return (
    <div className="mb-4">
      <label className="text-sm font-medium">{t("savedAddresses")}</label>
      <Select
        onValueChange={(id) => {
          const address = addresses.find((a) => a.id === id);
          if (address) onSelect(address);
        }}
      >
        <SelectTrigger className="mt-1">
          <SelectValue placeholder={t("selectAddress")} />
        </SelectTrigger>
        <SelectContent>
          {addresses.map((address) => (
            <SelectItem key={address.id} value={address.id}>
              {address.label} — {address.name}, {address.address1}, {address.zip}{" "}
              {address.city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
