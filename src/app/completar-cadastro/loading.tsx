export default function CompletarCadastroLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <div className="h-36 animate-pulse rounded-lg bg-white shadow-sm" />
        <div className="mt-6 grid gap-6">
          <div className="h-80 animate-pulse rounded-lg bg-white shadow-sm" />
          <div className="h-80 animate-pulse rounded-lg bg-white shadow-sm" />
        </div>
      </div>
    </main>
  );
}
