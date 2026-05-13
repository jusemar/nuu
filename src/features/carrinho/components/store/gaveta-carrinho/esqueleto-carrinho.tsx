import { Skeleton } from "@/components/ui/skeleton";

export function EsqueletoCarrinho() {
  return (
    <div className="space-y-3 px-5 py-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          className="grid grid-cols-[84px_1fr] gap-4 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
          key={index}
        >
          <Skeleton className="aspect-square rounded-md" />
          <div className="space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="flex items-end justify-between">
              <Skeleton className="h-9 w-[112px]" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
