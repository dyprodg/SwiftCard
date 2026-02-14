import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  CONFIRMED: {
    label: "Confirmed",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
  SHIPPED: {
    label: "Shipped",
    className: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  DELIVERED: {
    label: "Delivered",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-800 border-red-200" },
  REFUNDED: { label: "Refunded", className: "bg-gray-100 text-gray-800 border-gray-200" },
};

const paymentStatusConfig: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  PAID: { label: "Paid", className: "bg-green-100 text-green-800 border-green-200" },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-800 border-red-200" },
  REFUNDED: { label: "Refunded", className: "bg-gray-100 text-gray-800 border-gray-200" },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, className: "" };
  return (
    <Badge variant="outline" className={cn("border", config.className)}>
      {config.label}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const config = paymentStatusConfig[status] ?? { label: status, className: "" };
  return (
    <Badge variant="outline" className={cn("border", config.className)}>
      {config.label}
    </Badge>
  );
}
