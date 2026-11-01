"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  formatarCentavosHistoricos,
  formatarDataHistorica,
} from "../../../lib/painel-comissoes/formatar-valores";
import { ROTULOS_SITUACAO } from "../../../lib/painel-comissoes/situacao-comissao";
import type { LinhaComissao } from "../../../types/painel-comissoes/painel.types";
/** As mesmas linhas viram cards no celular, sem inputs duplicados ou hover obrigatório. */
export function ListagemComissoes({
  linhas,
  abrir,
}: {
  linhas: LinhaComissao[];
  abrir: (id: string) => void;
}) {
  if (!linhas.length)
    return (
      <p className="text-muted-foreground rounded-xl border p-6">
        Nenhuma comissão encontrada para os filtros.
      </p>
    );
  return (
    <div className="grid min-w-0 gap-3 lg:gap-0 lg:overflow-hidden lg:rounded-xl lg:border">
      <div className="bg-muted text-muted-foreground hidden grid-cols-6 gap-4 p-4 text-xs lg:grid">
        {[
          "Venda / produto",
          "Pedido / fornecedor",
          "Quantidade",
          "Valor vendido",
          "Comissão / situação",
          "Ação",
        ].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      {linhas.map((l) => (
        <article
          key={l.id}
          className="bg-card grid min-w-0 gap-3 rounded-xl border p-4 lg:grid-cols-6 lg:items-center lg:rounded-none lg:border-0 lg:border-b"
        >
          <div className="min-w-0">
            <p className="font-semibold break-words">{l.produto}</p>
            <p className="text-muted-foreground text-xs">
              {formatarDataHistorica(l.data)}
            </p>
            {l.sku && (
              <p className="text-muted-foreground text-xs break-all">
                SKU: {l.sku}
              </p>
            )}
          </div>
          <div className="min-w-0 text-sm">
            <p>Pedido {l.pedido}</p>
            <p className="text-muted-foreground break-words">{l.fornecedor}</p>
            {l.gestao && (
              <p className="break-words">{l.gestao.representante}</p>
            )}
          </div>
          <p className="text-sm">{l.quantidade} unidade(s)</p>
          <div>
            <span className="text-muted-foreground text-xs lg:hidden">
              Valor vendido
            </span>
            <p className="break-words tabular-nums">
              {formatarCentavosHistoricos(l.vendidoCentavos)}
            </p>
          </div>
          <div className="min-w-0">
            <span className="text-muted-foreground text-xs lg:hidden">
              Comissão
            </span>
            <p className="mb-2 font-medium break-words tabular-nums">
              {formatarCentavosHistoricos(l.comissaoCentavos)}
            </p>
            <Badge variant="secondary" className="h-auto whitespace-normal">
              {ROTULOS_SITUACAO[l.situacao]}
            </Badge>
          </div>
          <Button
            variant="outline"
            className="min-h-11 w-full"
            onClick={() => abrir(l.id)}
            aria-label={`Detalhes da comissão de ${l.produto}`}
          >
            Detalhes
          </Button>
        </article>
      ))}
    </div>
  );
}
