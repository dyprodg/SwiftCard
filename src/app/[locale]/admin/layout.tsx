import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";

type Props = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: Props) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") notFound();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
