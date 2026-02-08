type Props = {
  children: React.ReactNode;
};

export default function StorefrontLayout({ children }: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header will be added in Phase 2 */}
      <main className="flex-1">{children}</main>
      {/* Footer will be added later */}
    </div>
  );
}
