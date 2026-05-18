export default function AdminOrdersLoading() {
  return (
    <div className="space-y-5">
      <div className="h-32 animate-pulse rounded-lg border bg-white" />
      <div className="h-28 animate-pulse rounded-lg border bg-white" />
      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="h-12 animate-pulse border-b bg-slate-100" />
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-14 animate-pulse border-b bg-white last:border-b-0"
          />
        ))}
      </div>
    </div>
  );
}
