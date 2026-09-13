import { CalendarDays, Clock3 } from "lucide-react";

import { formatarDiasEntregaPropria } from "../../lib/pesquisar-destinos-entrega-propria";

/** Mostra a agenda efetiva de um destino (própria ou herdada) e sua origem. */
export function ResumoAgendaGeograficaEmUso({
  agenda,
}: {
  agenda: {
    diasAtendidos: number[];
    horarioCorte: string;
    origem: string;
  } | null;
}) {
  if (!agenda) {
    return (
      <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
        Nenhum nível acima possui agenda. Salve uma agenda própria para liberar
        a Entrega Própria neste destino.
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-md bg-blue-50 p-3 text-sm text-blue-900">
      <p className="font-medium">Agenda em uso — origem {agenda.origem}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <p className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          {formatarDiasEntregaPropria(agenda.diasAtendidos)}
        </p>
        <p className="flex items-center gap-2">
          <Clock3 className="h-4 w-4" aria-hidden="true" /> Corte às{" "}
          {agenda.horarioCorte}
        </p>
      </div>
    </div>
  );
}
