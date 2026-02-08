type Props = {
  children: React.ReactNode;
};

export default function AdminLayout({ children }: Props) {
  return (
    <div className="flex min-h-screen">
      {/* Admin sidebar will be added in Phase 2 */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
