"use client";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { usePainelComissoes } from "../../../hooks/painel-comissoes/use-painel-comissoes";
import type { FiltrosPainelComissoes } from "../../../types/painel-comissoes/painel.types";
import { CartoesComissoes } from "./cartoes-comissoes";
import { DetalheComissaoModal } from "./detalhe-comissao";
import { FiltrosComissoes } from "./filtros-comissoes";
import { ListagemComissoes } from "./listagem-comissoes";
export function PainelComissoes({ gestor }: { gestor: boolean }) {
  const [filtros, setFiltros] = useState<FiltrosPainelComissoes>({ pagina: 1 }),
    [detalhe, setDetalhe] = useState("");
  const consulta = usePainelComissoes(filtros),
    d = consulta.data;
  return (
    <div className="min-w-0 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">
          {gestor ? "Comissões de representantes" : "Vendas e comissões"}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {gestor
            ? "Audite os registros históricos e registre quitações externas já realizadas."
            : "Acompanhe suas vendas confirmadas e comissões históricas."}
        </p>
      </div>
      <FiltrosComissoes
        gestor={gestor}
        aplicar={(f) => setFiltros({ ...f, pagina: 1 })}
      />
      {consulta.isPending ? (
        <p role="status">Carregando comissões…</p>
      ) : consulta.isError ? (
        <p role="alert">
          Não foi possível consultar as comissões. Confira sua sessão e os
          filtros.
        </p>
      ) : (
        d && (
          <>
            <CartoesComissoes totais={d.totais} />
            <p className="text-muted-foreground text-xs">
              Indicadores do período e filtros selecionados. Não representam
              carteira ou saldo sacável. Quitações históricas podem também
              constar entre comissões invalidadas posteriormente.
            </p>
            <ListagemComissoes linhas={d.linhas} abrir={setDetalhe} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground text-sm">
                {d.total} registro(s) · Página {d.pagina}
              </p>
              <div className="flex gap-2">
                <Button
                  className="min-h-11"
                  variant="outline"
                  disabled={d.pagina <= 1 || consulta.isFetching}
                  onClick={() =>
                    setFiltros((f) => ({ ...f, pagina: d.pagina - 1 }))
                  }
                >
                  Anterior
                </Button>
                <Button
                  className="min-h-11"
                  variant="outline"
                  disabled={
                    d.pagina * d.porPagina >= d.total || consulta.isFetching
                  }
                  onClick={() =>
                    setFiltros((f) => ({ ...f, pagina: d.pagina + 1 }))
                  }
                >
                  Próxima
                </Button>
              </div>
            </div>
          </>
        )
      )}
      {detalhe && (
        <DetalheComissaoModal id={detalhe} fechar={() => setDetalhe("")} />
      )}
    </div>
  );
}
