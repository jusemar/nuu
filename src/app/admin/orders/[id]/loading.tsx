export default function AdminOrderDetailLoading() {
  return (
    <div className="space-y-5">
      <div className="h-36 animate-pulse rounded-lg border bg-white" />
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="h-56 animate-pulse rounded-lg border bg-white" />
          <div className="h-56 animate-pulse rounded-lg border bg-white" />
          <div className="h-72 animate-pulse rounded-lg border bg-white" />
        </div>
        <div className="space-y-5">
          <div className="h-56 animate-pulse rounded-lg border bg-white" />
          <div className="h-72 animate-pulse rounded-lg border bg-white" />
        </div>
      </div>
    </div>
  );
}
