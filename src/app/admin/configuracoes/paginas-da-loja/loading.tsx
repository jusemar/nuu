import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingPaginasDaLoja() {
  return (
    <div className="space-y-6" aria-label="Carregando grupos de navegação">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, indice) => (
          <Skeleton key={indice} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}
