"use client";

import { Eye, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { tratarProdutosFornecedorComoNovos } from "../../actions/tratar-produtos-fornecedor-como-novos";
import { vincularProdutoFornecedor } from "../../actions/vincular-produto-fornecedor";
import type { ProdutoParaVinculoFornecedor } from "../../types/fornecedores.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type LinhaVinculacaoFornecedor = {
  id: string;
  codigoFornecedor: string | null;
  nomeProduto: string;
  categoriaFornecedor: string | null;
  marcaFornecedor: string | null;
  precoFornecedor: string | null;
  precoCalculado: string | null;
  origemAjuste: string;
  estoqueFornecedor: number | null;
  produtoLocalizadoId: string | null;
  criterioLocalizacao: string | null;
  produtoVinculadoNome: string | null;
  produtoVinculadoSku: string | null;
  status: string;
  errosValidacao: Array<{ codigo: string; mensagem: string; campo?: string }>;
  dadosBrutos: Record<string, string | number | boolean | Date | null>;
};

type PaginacaoFornecedor = {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
};

type FiltrosFornecedor = {
  etapa: string;
  busca?: string;
  codigoFornecedor?: string;
  categoriaFornecedor?: string;
  marcaFornecedor?: string;
  status?: string;
  vinculo?: string;
  pagina: number;
  limite: number;
  vincularStagingId?: string;
  buscaProduto?: string;
};

type AbaVinculacaoImportacaoFornecedorProps = {
  importacaoId: string;
  linhas: LinhaVinculacaoFornecedor[];
  paginacao: PaginacaoFornecedor;
  filtros: FiltrosFornecedor;
  produtosParaVinculo: ProdutoParaVinculoFornecedor[];
};

function formatarMoeda(valor: string | null) {
  if (!valor) return "-";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor));
}

function RotuloOrigem({
  campo,
  origem,
  alinhar = "left",
}: {
  campo: string;
  origem: "arquivo" | "loja";
  alinhar?: "left" | "right";
}) {
  return (
    <span
      className={`inline-flex flex-col leading-tight ${
        alinhar === "right" ? "items-end text-right" : "items-start text-left"
      }`}
    >
      <span>{campo}</span>
      <span className="text-[10px] font-medium tracking-normal text-slate-400 normal-case">
        {origem}
      </span>
    </span>
  );
}

function montarUrl(
  importacaoId: string,
  filtros: FiltrosFornecedor,
  novos: Record<string, string | number | undefined>,
) {
  const parametros = new URLSearchParams();
  const dados = { ...filtros, ...novos };

  Object.entries(dados).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== "") {
      parametros.set(chave, String(valor));
    }
  });

  return `/admin/fornecedores/importacoes/${importacaoId}?${parametros.toString()}`;
}

function possuiProdutoRealVinculado(linha: LinhaVinculacaoFornecedor) {
  return Boolean(linha.produtoLocalizadoId && linha.produtoVinculadoNome);
}

function podeSelecionarComoNovo(linha: LinhaVinculacaoFornecedor) {
  return (
    !possuiProdutoRealVinculado(linha) &&
    linha.status !== "erro" &&
    linha.status !== "rejeitado"
  );
}

function rotuloStatusVinculacao(linha: LinhaVinculacaoFornecedor) {
  if (linha.status === "erro") return "Com erro";
  if (
    linha.criterioLocalizacao === "vinculo_manual_fornecedor" &&
    possuiProdutoRealVinculado(linha)
  ) {
    return "Vinculado manualmente";
  }
  if (
    linha.criterioLocalizacao === "vinculo_fornecedor" &&
    possuiProdutoRealVinculado(linha)
  ) {
    return "Vinculado automaticamente";
  }
  if (linha.criterioLocalizacao === "novo_produto_fornecedor") {
    return "Novo produto do fornecedor";
  }
  if (!linha.codigoFornecedor?.trim()) return "Sem código";

  return "Sem vínculo";
}

function classeStatusVinculacao(linha: LinhaVinculacaoFornecedor) {
  const status = rotuloStatusVinculacao(linha);

  if (status.includes("Vinculado")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Novo produto do fornecedor") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "Sem código") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "Com erro") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function ResumoVinculacao({ linhas }: { linhas: LinhaVinculacaoFornecedor[] }) {
  const resumo = useMemo(() => {
    const vinculadosAutomaticamente = linhas.filter(
      (linha) =>
        linha.criterioLocalizacao === "vinculo_fornecedor" &&
        possuiProdutoRealVinculado(linha),
    ).length;
    const vinculadosManualmente = linhas.filter(
      (linha) =>
        linha.criterioLocalizacao === "vinculo_manual_fornecedor" &&
        possuiProdutoRealVinculado(linha),
    ).length;
    const marcadosComoNovos = linhas.filter(
      (linha) => linha.criterioLocalizacao === "novo_produto_fornecedor",
    ).length;
    const semCodigo = linhas.filter(
      (linha) => !linha.codigoFornecedor?.trim(),
    ).length;
    const semVinculo = linhas.filter(
      (linha) =>
        !possuiProdutoRealVinculado(linha) &&
        linha.criterioLocalizacao !== "novo_produto_fornecedor" &&
        linha.status !== "erro",
    ).length;

    return [
      ["Total de itens", linhas.length],
      ["Vinculados automaticamente", vinculadosAutomaticamente],
      ["Vinculados manualmente", vinculadosManualmente],
      ["Sem vínculo", semVinculo],
      ["Marcados como novos", marcadosComoNovos],
      ["Sem código", semCodigo],
    ];
  }, [linhas]);

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
      {resumo.map(([label, valor]) => (
        <div
          key={label}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2"
        >
          <p className="text-[11px] font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{valor}</p>
        </div>
      ))}
    </div>
  );
}

function DrawerDetalhesVinculacao({
  linha,
}: {
  linha: LinhaVinculacaoFornecedor;
}) {
  const produtoReal = possuiProdutoRealVinculado(linha);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className="px-2">
          <Eye className="h-4 w-4" />
          <span className="sr-only">Ver detalhes</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Detalhes do produto</SheetTitle>
          <SheetDescription>{linha.codigoFornecedor ?? "-"}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          <section className="space-y-1">
            <h3 className="text-sm font-medium">
              <RotuloOrigem campo="Nome" origem="arquivo" />
            </h3>
            <p className="text-sm text-slate-700">{linha.nomeProduto}</p>
            <p className="text-xs text-slate-500">
              Categoria arquivo: {linha.categoriaFornecedor ?? "sem categoria"}{" "}
              · Marca arquivo: {linha.marcaFornecedor ?? "sem marca"}
            </p>
          </section>
          <section className="space-y-1">
            <h3 className="text-sm font-medium">
              <RotuloOrigem campo="Produto" origem="loja" />
            </h3>
            <p className="text-sm text-slate-700">
              {produtoReal ? linha.produtoVinculadoNome : "Não vinculado"}
            </p>
            <p className="text-xs text-slate-500">
              SKU loja {produtoReal ? linha.produtoVinculadoSku : "-"}
            </p>
          </section>
          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Preço arquivo</p>
              <p className="font-medium">
                {formatarMoeda(linha.precoFornecedor)}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Preço ajustado</p>
              <p className="font-medium">
                {formatarMoeda(linha.precoCalculado)}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Estoque arquivo</p>
              <p className="font-medium">{linha.estoqueFornecedor ?? "-"}</p>
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Status</p>
              <p className="font-medium">{rotuloStatusVinculacao(linha)}</p>
            </div>
          </section>
          <details className="rounded-md border border-slate-200 p-3">
            <summary className="cursor-pointer text-sm font-medium">
              Dados brutos da planilha
            </summary>
            <dl className="mt-3 grid gap-2 text-sm">
              {Object.entries(linha.dadosBrutos).map(([campo, valor]) => (
                <div
                  key={campo}
                  className="grid gap-1 rounded-md bg-slate-50 p-2 sm:grid-cols-[160px_1fr]"
                >
                  <dt className="text-xs text-slate-500">{campo}</dt>
                  <dd className="break-words whitespace-normal text-slate-700">
                    {String(valor ?? "-")}
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AbaVinculacaoImportacaoFornecedor({
  importacaoId,
  linhas,
  paginacao,
  filtros,
  produtosParaVinculo,
}: AbaVinculacaoImportacaoFornecedorProps) {
  const [idsSelecionados, setIdsSelecionados] = useState<string[]>([]);
  const [produtosSelecionados, setProdutosSelecionados] = useState<
    Record<string, string>
  >({});

  function alternarLinha(id: string, selecionado: boolean) {
    setIdsSelecionados((idsAtuais) =>
      selecionado
        ? Array.from(new Set([...idsAtuais, id]))
        : idsAtuais.filter((item) => item !== id),
    );
  }

  function selecionarProduto(stagingId: string, produtoId: string) {
    setProdutosSelecionados((produtosAtuais) => ({
      ...produtosAtuais,
      [stagingId]: produtoId,
    }));
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-950">
          Vinculação de produtos
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Associe os itens do arquivo do fornecedor aos produtos existentes da
          loja ou marque como novos produtos.
        </p>
      </div>

      <ResumoVinculacao linhas={linhas} />

      <form
        action={tratarProdutosFornecedorComoNovos}
        className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <input type="hidden" name="importacaoId" value={importacaoId} />
        {idsSelecionados.map((id) => (
          <input key={id} type="hidden" name="stagingIds" value={id} />
        ))}
        <span className="text-sm font-medium text-slate-700">
          {idsSelecionados.length} itens selecionados
        </span>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={idsSelecionados.length === 0}
            onClick={() => setIdsSelecionados([])}
          >
            Limpar seleção
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={idsSelecionados.length === 0}
          >
            Marcar selecionados como novos produtos
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10" />
              <TableHead className="w-[300px]">
                <RotuloOrigem campo="Nome" origem="arquivo" />
              </TableHead>
              <TableHead>
                <RotuloOrigem campo="Código" origem="arquivo" />
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="min-w-[340px]">
                <RotuloOrigem campo="Produto" origem="loja" />
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-20 text-center text-sm text-slate-500"
                >
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              linhas.map((linha) => {
                const linhaSelecionada = filtros.vincularStagingId === linha.id;
                const produtoReal = possuiProdutoRealVinculado(linha);
                const produtoSelecionado = produtosSelecionados[linha.id] ?? "";
                const podeSelecionar = podeSelecionarComoNovo(linha);
                const podeBuscar = !produtoReal && linha.status !== "erro";
                const novoProduto =
                  linha.criterioLocalizacao === "novo_produto_fornecedor";

                return (
                  <TableRow key={linha.id} className="align-top">
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={idsSelecionados.includes(linha.id)}
                        disabled={!podeSelecionar}
                        onChange={(evento) =>
                          alternarLinha(linha.id, evento.target.checked)
                        }
                        className="h-4 w-4 rounded border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Selecionar ${linha.nomeProduto}`}
                      />
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block truncate font-medium text-slate-950">
                            {linha.nomeProduto}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{linha.nomeProduto}</TooltipContent>
                      </Tooltip>
                      <span className="text-xs text-slate-500">
                        {linha.categoriaFornecedor ?? "sem categoria"} ·{" "}
                        {linha.marcaFornecedor ?? "sem marca"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">
                      {linha.codigoFornecedor ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={classeStatusVinculacao(linha)}
                      >
                        {rotuloStatusVinculacao(linha)}
                      </Badge>
                    </TableCell>
                    <TableCell className="min-w-[340px]">
                      {produtoReal ? (
                        <div className="max-w-[340px] rounded-md border border-emerald-100 bg-emerald-50/60 px-3 py-2">
                          <p className="truncate text-sm font-medium text-slate-950">
                            {linha.produtoVinculadoNome}
                          </p>
                          <p className="text-xs text-slate-500">
                            SKU loja {linha.produtoVinculadoSku ?? "-"}
                          </p>
                        </div>
                      ) : novoProduto ? (
                        <span className="text-sm text-slate-500">
                          Será tratado como novo
                        </span>
                      ) : podeBuscar ? (
                        <div className="grid gap-2">
                          <form
                            method="get"
                            action={`/admin/fornecedores/importacoes/${importacaoId}`}
                            className="flex gap-2"
                          >
                            <input
                              type="hidden"
                              name="etapa"
                              value="vinculacao"
                            />
                            <input
                              type="hidden"
                              name="pagina"
                              value={filtros.pagina}
                            />
                            <input
                              type="hidden"
                              name="limite"
                              value={filtros.limite}
                            />
                            <input
                              type="hidden"
                              name="busca"
                              value={filtros.busca ?? ""}
                            />
                            <input
                              type="hidden"
                              name="codigoFornecedor"
                              value={filtros.codigoFornecedor ?? ""}
                            />
                            <input
                              type="hidden"
                              name="categoriaFornecedor"
                              value={filtros.categoriaFornecedor ?? ""}
                            />
                            <input
                              type="hidden"
                              name="marcaFornecedor"
                              value={filtros.marcaFornecedor ?? ""}
                            />
                            <input
                              type="hidden"
                              name="status"
                              value={filtros.status ?? ""}
                            />
                            <input
                              type="hidden"
                              name="vinculo"
                              value={filtros.vinculo ?? ""}
                            />
                            <input
                              type="hidden"
                              name="vincularStagingId"
                              value={linha.id}
                            />
                            <input
                              name="buscaProduto"
                              defaultValue={
                                linhaSelecionada ? filtros.buscaProduto : ""
                              }
                              placeholder="Buscar produto da loja"
                              className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm"
                            />
                            <Button size="sm" type="submit" variant="outline">
                              <Search className="h-4 w-4" />
                              <span className="sr-only">Buscar</span>
                            </Button>
                          </form>

                          {linhaSelecionada ? (
                            <form
                              action={vincularProdutoFornecedor}
                              className="flex gap-2"
                            >
                              <input
                                type="hidden"
                                name="stagingId"
                                value={linha.id}
                              />
                              <input
                                type="hidden"
                                name="produtoId"
                                value={produtoSelecionado}
                              />
                              <select
                                value={produtoSelecionado}
                                onChange={(evento) =>
                                  selecionarProduto(
                                    linha.id,
                                    evento.target.value,
                                  )
                                }
                                className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm"
                              >
                                <option value="">Selecione o produto</option>
                                {produtosParaVinculo.map((produto) => (
                                  <option key={produto.id} value={produto.id}>
                                    {produto.nome} · SKU {produto.sku}
                                    {produto.marca ? ` · ${produto.marca}` : ""}
                                  </option>
                                ))}
                              </select>
                              <Button
                                size="sm"
                                type="submit"
                                disabled={!produtoSelecionado}
                              >
                                Vincular
                              </Button>
                            </form>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">
                          Corrija o erro antes de vincular
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DrawerDetalhesVinculacao linha={linha} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-2 border-t border-slate-200 p-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Página {paginacao.pagina} de {paginacao.totalPaginas} ·{" "}
            {paginacao.total} itens
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={paginacao.pagina <= 1}
              asChild={paginacao.pagina > 1}
            >
              {paginacao.pagina > 1 ? (
                <Link
                  href={montarUrl(importacaoId, filtros, {
                    pagina: paginacao.pagina - 1,
                  })}
                >
                  Anterior
                </Link>
              ) : (
                "Anterior"
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={paginacao.pagina >= paginacao.totalPaginas}
              asChild={paginacao.pagina < paginacao.totalPaginas}
            >
              {paginacao.pagina < paginacao.totalPaginas ? (
                <Link
                  href={montarUrl(importacaoId, filtros, {
                    pagina: paginacao.pagina + 1,
                  })}
                >
                  Próxima
                </Link>
              ) : (
                "Próxima"
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
