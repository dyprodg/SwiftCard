import { Badge } from "@/components/ui/badge";

type Props = {
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;
};

export function DiscountBadge({ type, value }: Props) {
  let label = "";

  switch (type) {
    case "PERCENTAGE":
      label = `-${(value / 100).toFixed(value % 100 === 0 ? 0 : 2)}%`;
      break;
    case "FIXED":
      label = `-CHF ${(value / 100).toFixed(2)}`;
      break;
    case "FREE_SHIPPING":
      label = "Free Shipping";
      break;
  }

  return (
    <Badge variant="destructive" className="text-xs">
      {label}
    </Badge>
  );
}
