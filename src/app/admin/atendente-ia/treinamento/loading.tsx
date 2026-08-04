import { Skeleton } from "@/components/ui/skeleton";

export default function TreinamentoAtendenteIaLoading() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-label="Carregando área de treinamento"
    >
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-5 w-full max-w-2xl" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, indice) => (
          <Skeleton key={indice} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
      <span className="sr-only">Carregando conteúdo</span>
    </div>
  );
}
