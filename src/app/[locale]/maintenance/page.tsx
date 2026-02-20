import { Construction } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Construction className="text-muted-foreground mb-6 h-16 w-16" />
      <h1 className="text-3xl font-bold tracking-tight">We&apos;ll be right back</h1>
      <p className="text-muted-foreground mt-4 max-w-md text-lg">
        We&apos;re currently performing scheduled maintenance. Please check back shortly.
      </p>
    </div>
  );
}
