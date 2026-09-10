import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CarregandoConviteAdministrativo() {
  return (
    <main className="bg-muted/40 flex min-h-dvh items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center space-y-3">
          <Skeleton className="size-11 rounded-lg" />
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </main>
  );
}
