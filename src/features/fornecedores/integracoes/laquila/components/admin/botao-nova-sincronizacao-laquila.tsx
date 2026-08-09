"use client";

import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { iniciarSincronizacaoLaquila } from "../../actions";
import type { ProgressoRecebidosApiLaquila } from "../../queries";

const ENDERECO_PROGRESSO =
  "/admin/fornecedores/integracoes/laquila/produtos/progresso";

type BotaoNovaSincronizacaoLaquilaProps = {
  /** Desabilita a ação enquanto a integração não estiver pronta para consultar. */
  desabilitado?: boolean;
  motivoDesabilitado?: string;
};

/**
 * Único gatilho de chamada à API Laquila em todo o fluxo.
 *
 * Cada clique cria uma importação nova e leva o gestor para ela. Execuções
 * anteriores não são tocadas: o que foi vinculado, conciliado ou publicado na
 * #101 continua exatamente como estava depois que a #102 nasce.
 */
export function BotaoNovaSincronizacaoLaquila({
  desabilitado,
  motivoDesabilitado,
}: BotaoNovaSincronizacaoLaquilaProps) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [progresso, setProgresso] =
    useState<ProgressoRecebidosApiLaquila | null>(null);
  const [sincronizando, iniciarTransicao] = useTransition();

  // A consulta percorre o catálogo inteiro e pode levar minutos. Sem sinal de
  // progresso o gestor não distingue "trabalhando" de "travado" e tende a
  // clicar de novo — o que criaria uma segunda importação sem querer.
  useEffect(() => {
    if (!sincronizando) return;

    let ativo = true;

    async function consultarProgresso() {
      try {
        const resposta = await fetch(ENDERECO_PROGRESSO, { cache: "no-store" });
        if (!resposta.ok || !ativo) return;

        setProgresso((await resposta.json()) as ProgressoRecebidosApiLaquila);
      } catch {
        // O progresso é auxiliar: falha aqui não interrompe a sincronização.
      }
    }

    void consultarProgresso();
    const intervalo = window.setInterval(consultarProgresso, 1200);

    return () => {
      ativo = false;
      window.clearInterval(intervalo);
    };
  }, [sincronizando]);

  function sincronizar() {
    setErro(null);

    iniciarTransicao(async () => {
      const resultado = await iniciarSincronizacaoLaquila();

      if (!resultado.sucesso || !resultado.importacaoId) {
        setErro(resultado.erro ?? "Não foi possível iniciar a sincronização.");
        return;
      }

      router.push(
        `/admin/fornecedores/integracoes/laquila/importacoes/${resultado.importacaoId}/produtos`,
      );
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        onClick={sincronizar}
        disabled={sincronizando || desabilitado}
        className="w-full sm:w-auto"
      >
        {sincronizando ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        {sincronizando
          ? "Buscando produtos Laquila..."
          : "Buscar produtos Laquila"}
      </Button>

      {sincronizando ? (
        <div className="space-y-1.5">
          <p className="text-xs text-slate-500">
            {progresso?.mensagem ??
              "Consultando catálogo, preço e estoque para esta execução."}
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full bg-blue-600 transition-[width] duration-500 ${
                progresso?.percentual === null || progresso === null
                  ? "w-1/3 animate-pulse"
                  : ""
              }`}
              style={
                typeof progresso?.percentual === "number"
                  ? {
                      width: `${Math.min(100, Math.max(0, Math.round(progresso.percentual)))}%`,
                    }
                  : undefined
              }
            />
          </div>
          <p className="text-xs text-slate-500">
            Recebidos até agora: {progresso?.totalBrutoCarregado ?? 0} · No
            recorte: {progresso?.totalAposRecorte ?? 0}
          </p>
        </div>
      ) : null}

      {desabilitado && motivoDesabilitado ? (
        <p className="text-xs text-slate-500">{motivoDesabilitado}</p>
      ) : null}

      {erro ? (
        <p className="flex items-start gap-2 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {erro}
        </p>
      ) : null}
    </div>
  );
}
