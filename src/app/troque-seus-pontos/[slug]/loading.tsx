import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/features/header";

export default function CarregandoConfirmacaoRecompensa() {
  return <><Header /><main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-2">
    <Skeleton className="h-96 rounded-xl" /><Skeleton className="h-96 rounded-xl" />
  </main></>;
}
