import { Skeleton } from "@/components/ui/skeleton";

export default function StorefrontLoading() {
  return (
    <div className="container mx-auto px-4 py-16">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="mt-4 h-6 w-96" />
    </div>
  );
}
