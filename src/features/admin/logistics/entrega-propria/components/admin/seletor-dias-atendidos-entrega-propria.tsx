"use client";

import { Button } from "@/components/ui/button";

const ROTULOS_DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Botões de alternância para os dias da semana (0 = domingo … 6 = sábado). */
export function SeletorDiasAtendidosEntregaPropria({
  dias,
  erro,
  onAlternar,
}: {
  dias: number[];
  erro?: string;
  onAlternar: (dia: number) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Dias atendidos</legend>
      <div className="flex flex-wrap gap-2">
        {ROTULOS_DIAS.map((rotulo, dia) => (
          <Button
            key={rotulo}
            type="button"
            size="sm"
            variant={dias.includes(dia) ? "default" : "outline"}
            aria-pressed={dias.includes(dia)}
            onClick={() => onAlternar(dia)}
          >
            {rotulo}
          </Button>
        ))}
      </div>
      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}
    </fieldset>
  );
}
