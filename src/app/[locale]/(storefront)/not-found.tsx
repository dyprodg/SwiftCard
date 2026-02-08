import Link from "next/link";

export default function StorefrontNotFound() {
  return (
    <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <h2 className="text-2xl font-bold">Page Not Found</h2>
      <p className="text-muted-foreground">
        The page you are looking for does not exist.
      </p>
      <Link href="/" className="bg-primary text-primary-foreground rounded-md px-4 py-2">
        Go Home
      </Link>
    </div>
  );
}
