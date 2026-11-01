"use client";
import { Card, CardContent } from "@/components/ui/card";

import { formatarCentavosHistoricos } from "../../../lib/painel-comissoes/formatar-valores";
import type { ResultadoPainelComissoes } from "../../../types/painel-comissoes/painel.types";
export function CartoesComissoes({
  totais,
}: {
  totais: ResultadoPainelComissoes["totais"];
}) {
  const indicadores = [
    ["Itens no período", totais.itens],
    ["Vendido válido", formatarCentavosHistoricos(totais.vendidoValido)],
    ["Comissão válida", formatarCentavosHistoricos(totais.comissaoValida)],
    ["A receber", formatarCentavosHistoricos(totais.aReceber)],
    ["Invalidada", formatarCentavosHistoricos(totais.invalidada)],
    ["Quitado histórico", formatarCentavosHistoricos(totais.quitadaHistorica)],
  ];
  return (
    <div className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-3">
      {indicadores.map(([nome, valor]) => (
        <Card key={nome} className="min-w-0 py-0">
          <CardContent className="min-w-0 p-4">
            <p className="text-muted-foreground text-sm">{nome}</p>
            <p className="mt-2 text-xl font-semibold break-words tabular-nums">
              {valor}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
