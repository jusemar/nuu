"use client";

import { Loader2, Tags } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AjudaContextualFreteExterno } from "./AjudaContextualFreteExterno";

type ClassificacaoDisponivel = { id: string; nome: string; ativo: boolean };
type ClassificacaoVinculada = {
  vinculoId: string;
  tipoLogisticoId: string;
  tipoLogisticoNome: string;
};

export function ClassificacoesLogisticasProduto({
  produtoId,
  classificacoesDisponiveis,
  classificacoesVinculadas,
  aoVincular,
  aoRemover,
  classificacoesSelecionadasNoCadastro = [],
  aoAlterarClassificacoesNoCadastro,
  carregando = false,
}: {
  produtoId?: string;
  classificacoesDisponiveis: ClassificacaoDisponivel[];
  classificacoesVinculadas: ClassificacaoVinculada[];
  aoVincular?: (tipoLogisticoId: string) => Promise<void>;
  aoRemover?: (vinculoId: string) => Promise<void>;
  classificacoesSelecionadasNoCadastro?: string[];
  aoAlterarClassificacoesNoCadastro?: (ids: string[]) => void;
  carregando?: boolean;
}) {
  const classificacoesEmUso = produtoId
    ? classificacoesVinculadas
    : classificacoesDisponiveis
        .filter((classificacao) =>
          classificacoesSelecionadasNoCadastro.includes(classificacao.id),
        )
        .map((classificacao) => ({
          vinculoId: classificacao.id,
          tipoLogisticoId: classificacao.id,
          tipoLogisticoNome: classificacao.nome,
        }));
  const identificadoresVinculados = new Set(
    classificacoesEmUso.map((classificacao) => classificacao.tipoLogisticoId),
  );
  const classificacoesParaSelecionar = classificacoesDisponiveis.filter(
    (classificacao) =>
      classificacao.ativo && !identificadoresVinculados.has(classificacao.id),
  );

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2">
          <Tags className="h-5 w-5" />
          Classificações Logísticas
          <AjudaContextualFreteExterno
            titulo="Classificação logística"
            descricao="Define como o produto participa do frete. Exemplos: produto pesado, grande volume e frágil. As classificações precisam ser cadastradas antes no painel de logística."
          />
        </CardTitle>
        <CardDescription>
          Essas classificações ajudam o sistema a definir quais transportadoras
          e serviços podem ser usados neste produto.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <section className="space-y-3">
          <h3 className="text-sm font-medium">Selecionar classificação</h3>
          {classificacoesParaSelecionar.length === 0 ? (
            <div className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
              Nenhuma classificação disponível para vincular.
            </div>
          ) : (
            <form
              onSubmit={async (evento) => {
                evento.preventDefault();
                const formulario = new FormData(evento.currentTarget);
                const tipoLogisticoId = String(
                  formulario.get("tipoLogisticoId") ?? "",
                );
                if (!produtoId) {
                  if (tipoLogisticoId) {
                    aoAlterarClassificacoesNoCadastro?.([
                      ...classificacoesSelecionadasNoCadastro,
                      tipoLogisticoId,
                    ]);
                  }
                  return;
                }
                await aoVincular?.(tipoLogisticoId);
              }}
              className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <select
                aria-label="Classificação logística"
                name="tipoLogisticoId"
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                defaultValue=""
              >
                <option value="" disabled>
                  Selecionar classificação
                </option>
                {classificacoesParaSelecionar.map((classificacao) => (
                  <option key={classificacao.id} value={classificacao.id}>
                    {classificacao.nome}
                  </option>
                ))}
              </select>
              <Button
                type="submit"
                disabled={
                  (produtoId
                    ? !aoVincular
                    : !aoAlterarClassificacoesNoCadastro) || carregando
                }
              >
                {carregando ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando
                  </span>
                ) : (
                  "Vincular"
                )}
              </Button>
            </form>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-medium">Vinculadas ao produto</h3>
          {classificacoesEmUso.length === 0 ? (
            <div className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
              Nenhuma classificação logística vinculada neste produto.
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {classificacoesEmUso.map((classificacao) => (
                <div
                  key={classificacao.vinculoId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                >
                  <Badge variant="secondary">
                    {classificacao.tipoLogisticoNome}
                  </Badge>
                  <form
                    onSubmit={async (evento) => {
                      evento.preventDefault();
                      if (!produtoId) {
                        aoAlterarClassificacoesNoCadastro?.(
                          classificacoesSelecionadasNoCadastro.filter(
                            (id) => id !== classificacao.tipoLogisticoId,
                          ),
                        );
                        return;
                      }
                      await aoRemover?.(classificacao.vinculoId);
                    }}
                  >
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      disabled={
                        (produtoId
                          ? !aoRemover
                          : !aoAlterarClassificacoesNoCadastro) || carregando
                      }
                    >
                      Remover
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
