import { Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingProdutosLaquila() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
      </section>

      <section className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-xs">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
        </span>
        <div>
          <p className="font-medium text-slate-900">
            Aguarde, carregando produtos da Laquila...
          </p>
          <p className="text-xs text-slate-500">
            Isso pode levar alguns segundos porque estamos consultando catálogo,
            preço e estoque.
          </p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, indice) => (
          <Skeleton key={indice} className="h-24 rounded-lg" />
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-xs">
        <div className="space-y-3 border-b border-slate-200 p-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-3 md:grid-cols-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, indice) => (
          <div
            key={indice}
            className="grid gap-4 border-b border-slate-100 p-4 md:grid-cols-[1.6fr_1fr_0.5fr_0.5fr_0.7fr]"
          >
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        ))}
      </section>
    </main>
  );
}
