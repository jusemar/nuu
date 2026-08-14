"use client";

import { Save, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  CONFIGURACAO_FIDELIDADE_INICIAL,
  criarRegrasDemonstracao,
} from "../../constants/dados-demonstracao";
import type {
  CategoriaFidelidade,
  ConfiguracaoFidelidadeMock,
  RegraCategoriaFidelidade,
} from "../../types/programa-fidelidade.types";
import { CartoesConfiguracaoFidelidade } from "./cartoes-configuracao-fidelidade";
import { RecursosFuturosFidelidade } from "./recursos-futuros-fidelidade";
import { RegrasCategoriasFidelidade } from "./regras-categorias-fidelidade";

export function PaginaProgramaFidelidadeAdmin({
  categorias,
}: {
  categorias: CategoriaFidelidade[];
}) {
  const regrasIniciais = useMemo(
    () => criarRegrasDemonstracao(categorias),
    [categorias],
  );
  const [configuracao, setConfiguracao] = useState(
    CONFIGURACAO_FIDELIDADE_INICIAL,
  );
  const [regras, setRegras] = useState(regrasIniciais);

  function atualizar<Campo extends keyof ConfiguracaoFidelidadeMock>(
    campo: Campo,
    valor: ConfiguracaoFidelidadeMock[Campo],
  ) {
    setConfiguracao((atual) => ({ ...atual, [campo]: valor }));
  }

  function atualizarRegra(
    categoriaId: string,
    alteracao: Partial<RegraCategoriaFidelidade>,
  ) {
    setRegras((atuais) =>
      atuais.map((regra) =>
        regra.categoriaId === categoriaId ? { ...regra, ...alteracao } : regra,
      ),
    );
  }

  function avisarDemonstracao() {
    toast.info("Demonstração visual: nenhuma configuração foi salva.");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="text-primary size-6" />
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Programa de Fidelidade
            </h1>
            <Badge variant={configuracao.ativo ? "success" : "secondary"}>
              {configuracao.ativo ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            Configure como clientes acumulam pontos e como eles serão
            convertidos em benefícios.
          </p>
          <Badge variant="outline">
            Ambiente de demonstração — alterações não são persistidas
          </Badge>
        </div>
        <Button onClick={avisarDemonstracao}>
          <Save /> Salvar configurações
        </Button>
      </header>

      <CartoesConfiguracaoFidelidade
        configuracao={configuracao}
        atualizar={atualizar}
      />
      <RegrasCategoriasFidelidade
        categorias={categorias}
        configuracao={configuracao}
        regras={regras}
        atualizarRegra={atualizarRegra}
      />
      <RecursosFuturosFidelidade />
    </div>
  );
}
