export default function ProgramaFidelidadeClienteLoading() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="h-20 animate-pulse rounded-lg border bg-white" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-lg border bg-white"
            />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-lg border bg-white" />
      </div>
    </div>
  );
}
