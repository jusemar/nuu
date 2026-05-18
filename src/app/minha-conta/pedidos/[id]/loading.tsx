export default function DetalhePedidoClienteLoading() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="h-36 animate-pulse rounded-lg border bg-white" />
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <div className="h-72 animate-pulse rounded-lg border bg-white" />
            <div className="h-64 animate-pulse rounded-lg border bg-white" />
          </div>
          <div className="space-y-5">
            <div className="h-56 animate-pulse rounded-lg border bg-white" />
            <div className="h-44 animate-pulse rounded-lg border bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
