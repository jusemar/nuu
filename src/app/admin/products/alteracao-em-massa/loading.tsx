import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingAlteracaoEmMassaProdutos() {
  return (
    <div
      className="mx-auto w-full max-w-[1600px] space-y-5 pb-28"
      aria-busy="true"
    >
      <div className="space-y-4 rounded-xl border p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-10 w-full max-w-xl" />
      </div>
      <div className="flex gap-5">
        <Skeleton className="hidden h-[620px] w-72 xl:block" />
        <Skeleton className="h-[620px] min-w-0 flex-1" />
      </div>
      <span className="sr-only">Carregando produtos</span>
    </div>
  );
}
