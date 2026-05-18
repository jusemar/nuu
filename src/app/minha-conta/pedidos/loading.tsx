export default function MeusPedidosLoading() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="h-24 animate-pulse rounded-lg border bg-white" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-lg border bg-white"
          />
        ))}
      </div>
    </div>
  );
}
