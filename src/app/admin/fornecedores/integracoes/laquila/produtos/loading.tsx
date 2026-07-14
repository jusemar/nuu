"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";

type ProgressoCarregamentoLaquila = {
  mensagem: string;
  paginaAtual?: number;
  totalPaginasEstimado?: number;
  totalPaginasExato?: boolean;
  percentual: number | null;
  totalBrutoCarregado: number;
};

export default function LoadingProdutosLaquila() {
  const [progresso, setProgresso] =
    useState<ProgressoCarregamentoLaquila | null>(null);

  useEffect(() => {
    let ativo = true;

    async function atualizarProgresso() {
      try {
        const resposta = await fetch(
          "/admin/fornecedores/integracoes/laquila/produtos/progresso",
          { cache: "no-store" },
        );

        if (!resposta.ok || !ativo) return;
        setProgresso((await resposta.json()) as ProgressoCarregamentoLaquila);
      } catch {
        // A consulta principal continua mesmo se o indicador ficar indisponível.
      }
    }

    void atualizarProgresso();
    const intervalo = window.setInterval(atualizarProgresso, 1200);

    return () => {
      ativo = false;
      window.clearInterval(intervalo);
    };
  }, []);

  const percentual =
    progresso?.percentual === null || progresso?.percentual === undefined
      ? 0
      : Math.min(100, Math.max(0, Math.round(progresso.percentual)));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-xs">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
          </span>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="font-medium text-slate-900">
                {progresso?.mensagem ?? "Preparando consulta da Laquila..."}
              </p>
              <p className="text-xs text-slate-500">
                Estamos consultando catálogo, preço e estoque. Isso pode levar
                alguns segundos.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span>
                  {progresso?.paginaAtual !== undefined
                    ? `${progresso.paginaAtual} página(s) carregada(s)`
                    : "Etapa atual: Preparando consulta"}
                  {progresso?.totalPaginasEstimado
                    ? progresso.totalPaginasExato
                      ? ` de ${progresso.totalPaginasEstimado}`
                      : ` de aproximadamente ${progresso.totalPaginasEstimado}`
                    : ""}
                </span>
                <span>{percentual}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-[width] duration-300"
                  style={{ width: `${percentual}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                Produtos recebidos até agora:{" "}
                {progresso?.totalBrutoCarregado ?? 0}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, indice) => (
          <Skeleton key={indice} className="h-24 rounded-lg" />
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-xs">
        <div className="space-y-3 border-b border-slate-200 p-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-3 md:grid-cols-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, indice) => (
          <div
            key={indice}
            className="grid gap-4 border-b border-slate-100 p-4 md:grid-cols-[1.6fr_1fr_0.5fr_0.5fr_0.7fr]"
          >
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        ))}
      </section>
    </main>
  );
}
