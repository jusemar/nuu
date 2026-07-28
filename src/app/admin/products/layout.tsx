export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 sm:p-4">{children}</div>
  );
}
