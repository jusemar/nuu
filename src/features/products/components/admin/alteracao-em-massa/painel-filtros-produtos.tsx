"use client";

import { ChevronDown, Filter, Info, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { EstadoListagemAlteracaoEmMassa } from "../../../hooks/alteracao-em-massa/use-listagem-alteracao-em-massa";
import type {
  CategoriaAlteracaoEmMassa,
  DadosAlteracaoEmMassa,
} from "../../../types/alteracao-em-massa.types";

type PainelFiltrosProdutosProps = {
  dados: DadosAlteracaoEmMassa;
  estado: EstadoListagemAlteracaoEmMassa;
  compacto?: boolean;
  onTentarAtualizar?: () => Promise<void>;
};

function GrupoFiltro({
  titulo,
  dica,
  children,
}: {
  titulo: string;
  dica?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2" aria-labelledby={`filtro-${titulo}`}>
      <div className="flex items-center gap-1.5">
        <h3
          id={`filtro-${titulo}`}
          className="text-muted-foreground text-xs font-semibold tracking-wide uppercase"
        >
          {titulo}
        </h3>
        {dica ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground rounded-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                aria-label={`Ajuda sobre ${titulo}`}
              >
                <Info className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-64">{dica}</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function OpcaoFiltro({
  id,
  rotulo,
  checked,
  onChange,
  recuo = 0,
  detalhe,
}: {
  id: string;
  rotulo: string;
  checked: boolean;
  onChange: () => void;
  recuo?: number;
  detalhe?: string;
}) {
  return (
    <label
      htmlFor={id}
      className="hover:bg-accent flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
      style={{ paddingLeft: `${8 + Math.min(recuo, 4) * 16}px` }}
    >
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      <span className="min-w-0 flex-1 truncate">{rotulo}</span>
      {detalhe ? (
        <span className="text-muted-foreground text-[11px]">{detalhe}</span>
      ) : null}
    </label>
  );
}

function ArvoreCategorias({
  categorias,
  selecionadas,
  alternar,
  parentId = null,
  nivelVisual = 0,
}: {
  categorias: CategoriaAlteracaoEmMassa[];
  selecionadas: Set<string>;
  alternar: (id: string) => void;
  parentId?: string | null;
  nivelVisual?: number;
}) {
  const filhas = categorias.filter(
    (categoria) => categoria.parentId === parentId,
  );

  return filhas.map((categoria) => {
    const possuiFilhas = categorias.some(
      (item) => item.parentId === categoria.id,
    );
    return (
      <div key={categoria.id}>
        <OpcaoFiltro
          id={`categoria-${categoria.id}`}
          rotulo={categoria.nome}
          checked={selecionadas.has(categoria.id)}
          onChange={() => alternar(categoria.id)}
          recuo={nivelVisual}
          detalhe={possuiFilhas ? "inclui filhas" : undefined}
        />
        <ArvoreCategorias
          categorias={categorias}
          selecionadas={selecionadas}
          alternar={alternar}
          parentId={categoria.id}
          nivelVisual={nivelVisual + 1}
        />
      </div>
    );
  });
}

export function PainelFiltrosProdutos({
  dados,
  estado,
  compacto = false,
  onTentarAtualizar,
}: PainelFiltrosProdutosProps) {
  const tiposPresentes = new Set(
    dados.produtos.map((produto) => produto.tipoProduto),
  );

  const conteudo = (
    <div className="space-y-6 p-4">
      <GrupoFiltro titulo="Status">
        <OpcaoFiltro
          id={`status-ativo-${compacto ? "mobile" : "desktop"}`}
          rotulo="Ativos"
          checked={estado.status.has("ativo")}
          onChange={() => estado.alternarStatus("ativo")}
        />
        <OpcaoFiltro
          id={`status-inativo-${compacto ? "mobile" : "desktop"}`}
          rotulo="Inativos"
          checked={estado.status.has("inativo")}
          onChange={() => estado.alternarStatus("inativo")}
        />
      </GrupoFiltro>

      <GrupoFiltro
        titulo="Categorias"
        dica="Ao selecionar uma categoria pai, os produtos de todas as categorias descendentes também são incluídos. Uma categoria filha filtra somente aquela ramificação."
      >
        {dados.avisos?.categorias ? (
          <AvisoAuxiliar
            mensagem={dados.avisos.categorias}
            onTentarAtualizar={onTentarAtualizar}
          />
        ) : null}
        <ArvoreCategorias
          categorias={dados.categorias}
          selecionadas={estado.categoriasIds}
          alternar={estado.alternarCategoria}
        />
      </GrupoFiltro>

      <GrupoFiltro titulo="Marcas">
        {dados.avisos?.marcas ? (
          <AvisoAuxiliar
            mensagem={dados.avisos.marcas}
            onTentarAtualizar={onTentarAtualizar}
          />
        ) : null}
        {dados.marcas.map((marca) => (
          <OpcaoFiltro
            key={marca.id}
            id={`marca-${marca.id}-${compacto ? "mobile" : "desktop"}`}
            rotulo={marca.nome}
            checked={estado.marcasIds.has(marca.id)}
            onChange={() => estado.alternarMarca(marca.id)}
            detalhe={!marca.ativa ? "inativa" : undefined}
          />
        ))}
      </GrupoFiltro>

      {(tiposPresentes.has("simple") || tiposPresentes.has("variable")) && (
        <GrupoFiltro
          titulo="Tipo de produto"
          dica="Exibe somente os tipos confiáveis já usados pelo projeto: simples e com variantes."
        >
          {tiposPresentes.has("simple") && (
            <OpcaoFiltro
              id={`tipo-simple-${compacto ? "mobile" : "desktop"}`}
              rotulo="Simples"
              checked={estado.tipos.has("simple")}
              onChange={() => estado.alternarTipo("simple")}
            />
          )}
          {tiposPresentes.has("variable") && (
            <OpcaoFiltro
              id={`tipo-variable-${compacto ? "mobile" : "desktop"}`}
              rotulo="Com variantes"
              checked={estado.tipos.has("variable")}
              onChange={() => estado.alternarTipo("variable")}
            />
          )}
        </GrupoFiltro>
      )}
    </div>
  );

  if (compacto) return conteudo;

  return (
    <aside className="bg-card sticky top-6 hidden max-h-[calc(100vh-3rem)] w-72 shrink-0 overflow-hidden rounded-xl border shadow-sm xl:block">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 font-medium">
          <Filter className="size-4" />
          Filtros
          {estado.totalFiltrosAtivos > 0 && (
            <Badge variant="secondary">{estado.totalFiltrosAtivos}</Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={estado.limparFiltros}
          disabled={estado.totalFiltrosAtivos === 0 && !estado.busca}
        >
          <RotateCcw className="size-3.5" />
          Limpar
        </Button>
      </div>
      <Separator />
      <ScrollArea className="h-[calc(100vh-7rem)]">{conteudo}</ScrollArea>
    </aside>
  );
}

function AvisoAuxiliar({
  mensagem,
  onTentarAtualizar,
}: {
  mensagem: string;
  onTentarAtualizar?: () => Promise<void>;
}) {
  return (
    <div
      className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900"
      role="status"
    >
      <p>{mensagem}</p>
      {onTentarAtualizar ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-1 h-7 px-2"
          onClick={() => void onTentarAtualizar().catch(() => undefined)}
        >
          <RotateCcw className="size-3" /> Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}
