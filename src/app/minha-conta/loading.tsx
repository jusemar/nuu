export default function MinhaContaLoading() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="h-44 animate-pulse rounded-lg border bg-white" />
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <div className="h-60 animate-pulse rounded-lg border bg-white" />
          <div className="h-60 animate-pulse rounded-lg border bg-white" />
        </div>
      </div>
    </div>
  );
}
