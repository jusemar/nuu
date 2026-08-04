import { Inbox } from "lucide-react";

export function EstadoVazio({
  descricao,
  titulo,
}: {
  descricao: string;
  titulo: string;
}) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center">
      <span className="bg-muted mb-3 rounded-full p-3">
        <Inbox className="text-muted-foreground size-5" aria-hidden="true" />
      </span>
      <h2 className="font-semibold">{titulo}</h2>
      <p className="text-muted-foreground mt-1 max-w-md text-sm">{descricao}</p>
    </div>
  );
}
