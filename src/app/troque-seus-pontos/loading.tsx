import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/features/header";

export default function CarregandoCatalogoRecompensas() {
  return <><Header /><main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-6">
    <Skeleton className="h-10 w-64" />
    <Skeleton className="h-5 w-80 max-w-full" />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((item) => <Skeleton key={item} className="h-80 rounded-xl" />)}
    </div>
  </main></>;
}
