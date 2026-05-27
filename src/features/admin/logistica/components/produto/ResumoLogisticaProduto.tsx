"use client";

import { Tag } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AjudaContextualFreteExterno } from "./AjudaContextualFreteExterno";
import { ClassificacoesLogisticasProduto } from "./ClassificacoesLogisticasProduto";
import { EstadoResumoLogisticaProduto } from "./EstadoResumoLogisticaProduto";

type TipoDisponivel = { id: string; nome: string; ativo: boolean };
type TipoVinculado = {
  vinculoId: string;
  tipoLogisticoId: string;
  tipoLogisticoNome: string;
};
type RegraProduto = {
  id: string;
  efeito: "permitir" | "bloquear";
  ativo: boolean;
  provedorNome: string | null;
  transportadoraNome: string | null;
  servicoNome: string | null;
};

export function ResumoLogisticaProduto({
  produtoId,
  tiposDisponiveis,
  tiposVinculados,
  regrasProduto,
  aoVincularTipo,
  aoDesvincularTipo,
  classificacoesSelecionadasNoCadastro = [],
  aoAlterarClassificacoesNoCadastro,
  carregando = false,
  mensagem = null,
}: {
  produtoId?: string;
  tiposDisponiveis: TipoDisponivel[];
  tiposVinculados: TipoVinculado[];
  regrasProduto: RegraProduto[];
  aoVincularTipo?: (tipoLogisticoId: string) => Promise<void>;
  aoDesvincularTipo?: (vinculoId: string) => Promise<void>;
  classificacoesSelecionadasNoCadastro?: string[];
  aoAlterarClassificacoesNoCadastro?: (ids: string[]) => void;
  carregando?: boolean;
  mensagem?: { tipo: "sucesso" | "erro"; texto: string } | null;
}) {
  if (!produtoId) {
    return (
      <ClassificacoesLogisticasProduto
        classificacoesDisponiveis={tiposDisponiveis}
        classificacoesVinculadas={tiposVinculados}
        classificacoesSelecionadasNoCadastro={
          classificacoesSelecionadasNoCadastro
        }
        aoAlterarClassificacoesNoCadastro={aoAlterarClassificacoesNoCadastro}
      />
    );
  }

  return (
    <div className="space-y-4">
      <EstadoResumoLogisticaProduto
        carregando={carregando}
        mensagem={mensagem}
      />

      <ClassificacoesLogisticasProduto
        produtoId={produtoId}
        classificacoesDisponiveis={tiposDisponiveis}
        classificacoesVinculadas={tiposVinculados}
        aoVincular={aoVincularTipo}
        aoRemover={aoDesvincularTipo}
        carregando={carregando}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Regras específicas cadastradas
            <AjudaContextualFreteExterno
              titulo="Regras específicas"
              descricao="Regras exclusivas deste produto. Usado apenas para exceções."
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <section className="space-y-2">
            <h3 className="text-sm font-medium">Específicas deste produto</h3>
            {regrasProduto.length === 0 ? (
              <div className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
                Nenhuma regra específica configurada para este produto.
              </div>
            ) : (
              <div className="space-y-2">
                {regrasProduto.map((regra) => (
                  <div key={regra.id} className="rounded-md border p-3 text-sm">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant={regra.ativo ? "default" : "secondary"}>
                        {regra.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                      <Badge
                        variant={
                          regra.efeito === "bloquear"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {regra.efeito === "bloquear" ? "Bloquear" : "Permitir"}
                      </Badge>
                    </div>
                    <p>
                      {regra.efeito === "bloquear" ? "Bloquear" : "Permitir"}{" "}
                      {regra.servicoNome ??
                        regra.transportadoraNome ??
                        "todos os serviços"}{" "}
                      neste produto
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              Herança da variante
              <AjudaContextualFreteExterno
                titulo="Herança da variante"
                descricao="Se a variante não possuir configuração própria, o sistema usa a configuração do produto."
              />
            </h3>
            <div className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
              Se a variante não possuir configuração própria, o sistema usa a
              configuração do produto.
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
