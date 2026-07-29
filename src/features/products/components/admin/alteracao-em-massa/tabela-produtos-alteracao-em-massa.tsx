"use client";

import { ArrowUpDown, ChevronLeft, ChevronRight, Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type {
  CampoOrdenacaoProdutos,
  EstadoListagemAlteracaoEmMassa,
} from "../../../hooks/alteracao-em-massa/use-listagem-alteracao-em-massa";
import { CelulaPrecosProduto } from "./celula-precos-produto";

type TabelaProdutosProps = {
  estado: EstadoListagemAlteracaoEmMassa;
  totalProdutos: number;
};

function CabecalhoOrdenavel({
  campo,
  estado,
  children,
}: {
  campo: CampoOrdenacaoProdutos;
  estado: EstadoListagemAlteracaoEmMassa;
  children: React.ReactNode;
}) {
  const ativo = estado.campoOrdenacao === campo;
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8"
      onClick={() => estado.alternarOrdenacao(campo)}
      aria-label={`Ordenar por ${String(children)}`}
    >
      {children}
      <ArrowUpDown
        className={`size-3.5 ${ativo ? "opacity-100" : "opacity-40"}`}
      />
    </Button>
  );
}

export function TabelaProdutosAlteracaoEmMassa({
  estado,
  totalProdutos,
}: TabelaProdutosProps) {
  const compacta = estado.densidade === "compacta";

  if (totalProdutos === 0) {
    return (
      <div className="bg-card flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
        <Package className="text-muted-foreground size-10" />
        <h2 className="mt-4 font-semibold">Nenhum produto cadastrado</h2>
        <p className="text-muted-foreground mt-1 max-w-md text-sm">
          A alteração em massa ficará disponível quando existirem produtos no
          catálogo.
        </p>
      </div>
    );
  }

  if (estado.produtosFiltrados.length === 0) {
    return (
      <div className="bg-card flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
        <Package className="text-muted-foreground size-10" />
        <h2 className="mt-4 font-semibold">Nenhum resultado encontrado</h2>
        <p className="text-muted-foreground mt-1 max-w-md text-sm">
          Ajuste a busca ou limpe os filtros para visualizar outros produtos.
        </p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={estado.limparFiltros}
        >
          Limpar filtros
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
      {/* No celular, cada produto vira um cartão para evitar uma tabela de 1080px. */}
      <div className="divide-y md:hidden">
        <div className="bg-muted/50 flex items-center gap-2 p-3 text-sm font-medium">
          <Checkbox
            checked={
              estado.paginaTodaSelecionada
                ? true
                : estado.paginaParcialmenteSelecionada
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={estado.alternarSelecaoPagina}
            aria-label="Selecionar produtos da página atual"
          />
          Selecionar página
        </div>
        {estado.produtosPagina.map((produto) => {
          const selecionado = estado.selecionadosIds.has(produto.id);
          return (
            <article
              key={produto.id}
              data-state={selecionado ? "selected" : undefined}
              className="data-[state=selected]:bg-muted/60 space-y-3 p-3"
            >
              <div className="flex min-w-0 items-start gap-3">
                <Checkbox
                  checked={selecionado}
                  onCheckedChange={() => estado.alternarProduto(produto.id)}
                  aria-label={`Selecionar ${produto.nome}`}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold">
                    {produto.nome}
                  </p>
                  <p className="text-muted-foreground mt-1 font-mono text-xs">
                    SKU: {produto.sku}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    produto.ativo
                      ? "shrink-0 border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "shrink-0 border-slate-200 bg-slate-100 text-slate-600"
                  }
                >
                  {produto.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div className="min-w-0">
                  <dt className="text-muted-foreground">Categoria</dt>
                  <dd className="truncate font-medium">
                    {produto.categoriaNome || "Sem categoria"}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-muted-foreground">Marca</dt>
                  <dd className="truncate font-medium">
                    {produto.marcaNome || "Sem marca"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Tipo</dt>
                  <dd className="font-medium">
                    {produto.tipoProduto === "variable"
                      ? "Com variantes"
                      : produto.tipoProduto === "simple"
                        ? "Simples"
                        : produto.tipoProduto}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Estoque</dt>
                  <dd className="font-medium">
                    {produto.tipoProduto === "simple"
                      ? produto.estoqueVarianteTecnica !== null
                        ? `${produto.estoqueVarianteTecnica} un.`
                        : "—"
                      : produto.resumoEstoqueVariantes || "—"}
                  </dd>
                </div>
              </dl>

              <div>
                <p className="text-muted-foreground mb-1 text-xs">Preços</p>
                <CelulaPrecosProduto precos={produto.precosModalidades} />
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <Table className="min-w-[1080px]">
          <TableHeader className="bg-muted/60">
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    estado.paginaTodaSelecionada
                      ? true
                      : estado.paginaParcialmenteSelecionada
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={estado.alternarSelecaoPagina}
                  aria-label="Selecionar produtos da página atual"
                />
              </TableHead>
              <TableHead className="min-w-64">
                <CabecalhoOrdenavel campo="nome" estado={estado}>
                  Produto
                </CabecalhoOrdenavel>
              </TableHead>
              <TableHead>
                <CabecalhoOrdenavel campo="sku" estado={estado}>
                  SKU
                </CabecalhoOrdenavel>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <CabecalhoOrdenavel campo="categoria" estado={estado}>
                  Categoria
                </CabecalhoOrdenavel>
              </TableHead>
              <TableHead>
                <CabecalhoOrdenavel campo="marca" estado={estado}>
                  Marca
                </CabecalhoOrdenavel>
              </TableHead>
              <TableHead className="min-w-80">Preços</TableHead>
              <TableHead className="min-w-36">Estoque</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estado.produtosPagina.map((produto) => {
              const selecionado = estado.selecionadosIds.has(produto.id);
              return (
                <TableRow
                  key={produto.id}
                  data-state={selecionado ? "selected" : undefined}
                  className="hover:bg-muted/40"
                >
                  <TableCell className={compacta ? "py-2" : "py-3.5"}>
                    <Checkbox
                      checked={selecionado}
                      onCheckedChange={() => estado.alternarProduto(produto.id)}
                      aria-label={`Selecionar ${produto.nome}`}
                    />
                  </TableCell>
                  <TableCell className={compacta ? "py-2" : "py-3.5"}>
                    <div className="min-w-0">
                      <p className="max-w-72 truncate font-medium">
                        {produto.nome}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {produto.tipoProduto === "variable"
                          ? "Com variantes"
                          : produto.tipoProduto === "simple"
                            ? "Simples"
                            : produto.tipoProduto}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {produto.sku}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        produto.ativo
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-100 text-slate-600"
                      }
                    >
                      <span
                        className={`mr-1.5 size-1.5 rounded-full ${produto.ativo ? "bg-emerald-500" : "bg-slate-400"}`}
                      />
                      {produto.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>{produto.categoriaNome}</TableCell>
                  <TableCell>{produto.marcaNome}</TableCell>
                  <TableCell>
                    <CelulaPrecosProduto precos={produto.precosModalidades} />
                  </TableCell>
                  <TableCell>
                    {produto.tipoProduto === "simple" ? (
                      produto.estoqueVarianteTecnica !== null ? (
                        <span className="font-mono text-sm font-semibold">
                          {produto.estoqueVarianteTecnica} un.
                        </span>
                      ) : (
                        <span
                          className="text-muted-foreground"
                          title={produto.conflitoVarianteTecnica ?? undefined}
                        >
                          —
                        </span>
                      )
                    ) : produto.tipoProduto === "variable" ? (
                      <span className="text-muted-foreground text-xs whitespace-nowrap">
                        {produto.resumoEstoqueVariantes ?? "—"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          Página {estado.pagina + 1} de {estado.totalPaginas} ·{" "}
          {estado.produtosFiltrados.length} resultado(s)
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={String(estado.itensPorPagina)}
            onValueChange={(valor) => estado.setItensPorPagina(Number(valor))}
          >
            <SelectTrigger className="w-32" aria-label="Produtos por página">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 50].map((quantidade) => (
                <SelectItem key={quantidade} value={String(quantidade)}>
                  {quantidade} por página
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => estado.setPagina((pagina) => pagina - 1)}
            disabled={estado.pagina === 0}
            aria-label="Página anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => estado.setPagina((pagina) => pagina + 1)}
            disabled={estado.pagina + 1 >= estado.totalPaginas}
            aria-label="Próxima página"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
