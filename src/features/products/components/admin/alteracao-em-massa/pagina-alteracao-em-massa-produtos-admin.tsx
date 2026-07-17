"use client";

import {
  AlertCircle,
  Filter,
  Info,
  Rows3,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { recarregarListagemAlteracaoEmMassa } from "../../../actions/recarregar-listagem-alteracao-em-massa";
import { useListagemAlteracaoEmMassa } from "../../../hooks/alteracao-em-massa/use-listagem-alteracao-em-massa";
import type { ResultadoAlteracaoEmMassa } from "../../../types/alteracao-em-massa.types";
import { BarraSelecaoProdutos } from "./barra-selecao-produtos";
import { PainelConfiguracaoVisual } from "./painel-configuracao-visual";
import { PainelFiltrosProdutos } from "./painel-filtros-produtos";
import { TabelaProdutosAlteracaoEmMassa } from "./tabela-produtos-alteracao-em-massa";

type PaginaAlteracaoEmMassaProps = {
  resultado: ResultadoAlteracaoEmMassa;
};

export function PaginaAlteracaoEmMassaProdutosAdmin({
  resultado,
}: PaginaAlteracaoEmMassaProps) {
  const [resultadoAtual, setResultadoAtual] = useState(resultado);
  const estado = useListagemAlteracaoEmMassa(resultadoAtual.dados);
  const [painelAberto, setPainelAberto] = useState(false);
  const produtosSelecionados = resultadoAtual.dados.produtos.filter((produto) =>
    estado.selecionadosIds.has(produto.id),
  );
  async function atualizarListagem() {
    const atualizado = await recarregarListagemAlteracaoEmMassa();
    if (!atualizado.sucesso) throw new Error(atualizado.erro);
    setResultadoAtual(atualizado);
  }

  if (!resultadoAtual.sucesso) {
    return (
      <main className="mx-auto w-full max-w-[1600px] p-4 md:p-6">
        <div className="flex min-h-96 flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50/60 p-8 text-center">
          <AlertCircle className="size-10 text-rose-600" />
          <h1 className="mt-4 text-xl font-semibold">Alteração em massa</h1>
          <p className="mt-2 max-w-lg text-sm text-rose-800">
            {resultadoAtual.erro}
          </p>
          <Button
            className="mt-5"
            variant="outline"
            onClick={() => location.reload()}
          >
            Tentar novamente
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-5 pb-28">
      <header className="bg-card rounded-xl border p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Alteração em massa
              </h1>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground rounded-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                    aria-label="Sobre esta fase"
                  >
                    <Info className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-72">
                  Esta primeira fase permite localizar, filtrar e selecionar
                  produtos reais sem executar alterações.
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
              Encontre produtos e prepare alterações com segurança. Nenhum dado
              será modificado nesta etapa.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {estado.produtosFiltrados.length} resultado(s)
              </Badge>
              <Badge variant="outline">Modo leitura</Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted inline-flex rounded-lg border p-1">
                  <Button
                    variant={
                      estado.densidade === "confortavel" ? "secondary" : "ghost"
                    }
                    size="sm"
                    onClick={() => estado.setDensidade("confortavel")}
                    aria-pressed={estado.densidade === "confortavel"}
                  >
                    <Rows3 className="size-4" />
                    Confortável
                  </Button>
                  <Button
                    variant={
                      estado.densidade === "compacta" ? "secondary" : "ghost"
                    }
                    size="sm"
                    onClick={() => estado.setDensidade("compacta")}
                    aria-pressed={estado.densidade === "compacta"}
                  >
                    <SlidersHorizontal className="size-4" />
                    Compacta
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Altera apenas o espaçamento visual das linhas.
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xl">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={estado.busca}
              onChange={(evento) => estado.setBusca(evento.target.value)}
              placeholder="Buscar por nome ou SKU..."
              aria-label="Buscar produtos por nome ou SKU"
              className="h-10 pl-9"
            />
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="xl:hidden">
                <Filter className="size-4" />
                <span className="hidden sm:inline">Filtros</span>
                {estado.totalFiltrosAtivos > 0 && (
                  <Badge variant="secondary">{estado.totalFiltrosAtivos}</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[90vw] gap-0 sm:max-w-md">
              <SheetHeader className="border-b">
                <SheetTitle>Filtros</SheetTitle>
                <SheetDescription>
                  Refine os produtos usando somente dados reais do catálogo.
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <PainelFiltrosProdutos
                  dados={resultadoAtual.dados}
                  estado={estado}
                  compacto
                  onTentarAtualizar={atualizarListagem}
                />
              </div>
              <div className="border-t p-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={estado.limparFiltros}
                  disabled={estado.totalFiltrosAtivos === 0 && !estado.busca}
                >
                  Limpar filtros
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="flex items-start gap-5">
        <PainelFiltrosProdutos
          dados={resultadoAtual.dados}
          estado={estado}
          onTentarAtualizar={atualizarListagem}
        />
        <section className="min-w-0 flex-1" aria-label="Produtos encontrados">
          <TabelaProdutosAlteracaoEmMassa
            estado={estado}
            totalProdutos={resultadoAtual.dados.produtos.length}
          />
        </section>
      </div>

      <BarraSelecaoProdutos
        quantidade={estado.selecionadosIds.size}
        onLimpar={estado.limparSelecao}
        onConfigurar={() => setPainelAberto(true)}
      />
      <PainelConfiguracaoVisual
        aberto={painelAberto}
        onOpenChange={setPainelAberto}
        produtosSelecionados={produtosSelecionados}
        dados={resultadoAtual.dados}
        onAplicacaoConcluida={estado.limparSelecao}
        onAtualizarListagem={atualizarListagem}
      />
    </main>
  );
}
