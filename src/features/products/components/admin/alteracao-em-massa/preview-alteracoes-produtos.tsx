"use client";

import { AlertTriangle, CheckCircle2, MinusCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import type { LinhaPreviewAlteracaoEmMassa } from "../../../lib/alteracao-em-massa/calcular-preview-alteracao-em-massa";

export function PreviewAlteracoesProdutos({
  linhas,
}: {
  linhas: LinhaPreviewAlteracaoEmMassa[];
}) {
  const contagem = (resultado: LinhaPreviewAlteracaoEmMassa["resultado"]) =>
    linhas.filter((linha) => linha.resultado === resultado).length;
  if (!linhas.length)
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="font-medium">Configure ao menos uma operação válida</p>
        <p className="text-muted-foreground mt-1 text-sm">
          A comparação aparecerá aqui sem modificar nenhum produto.
        </p>
      </div>
    );

  return (
    <section className="space-y-3" aria-labelledby="titulo-preview">
      <div>
        <h3 id="titulo-preview" className="font-semibold">
          Preview obrigatório
        </h3>
        <p className="text-muted-foreground text-sm">
          Comparação calculada no navegador. Nada será aplicado.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-emerald-100 text-emerald-800">
          {contagem("alterado")} alteração(ões)
        </Badge>
        <Badge variant="secondary">
          {contagem("sem_alteracao")} sem mudança
        </Badge>
        <Badge className="bg-amber-100 text-amber-800">
          {contagem("conflito")} conflito(s)
        </Badge>
        <Badge variant="outline">{contagem("ignorado")} ignorado(s)</Badge>
      </div>
      <div className="space-y-2 rounded-xl border p-2">
        {linhas.map((linha) => (
          <article
            key={linha.id}
            className="bg-card rounded-lg border p-3 text-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{linha.produto}</p>
                <p className="text-muted-foreground text-xs">
                  {linha.sku} · {linha.campo}
                </p>
              </div>
              {linha.resultado === "alterado" ? (
                <CheckCircle2 className="size-4 text-emerald-600" />
              ) : linha.resultado === "conflito" ? (
                <AlertTriangle className="size-4 text-amber-600" />
              ) : (
                <MinusCircle className="text-muted-foreground size-4" />
              )}
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div className="rounded-md bg-slate-50 p-2">
                <span className="text-muted-foreground text-xs">Atual</span>
                <p>{linha.atual}</p>
              </div>
              <div className="rounded-md bg-blue-50 p-2">
                <span className="text-xs text-blue-700">Novo</span>
                <p>{linha.novo}</p>
              </div>
            </div>
            {linha.motivo && (
              <p className="mt-2 text-xs text-amber-700">{linha.motivo}</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
