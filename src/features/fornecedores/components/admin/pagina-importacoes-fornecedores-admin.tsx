import {
  FileSpreadsheet,
  History,
  Plus,
  RefreshCw,
  Search,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

import {
  analisarImportacaoFornecedor,
  salvarAjustePrecoImportacao,
  vincularProdutoFornecedor,
} from "../../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { importarPlanilhaFornecedor } from "../../actions";
import {
  ordenarFornecedoresPorStatusENome,
  rotulosStatusFornecedor,
  rotulosTipoIntegracaoFornecedor,
} from "../../services/fornecedores.service";
import type { FornecedorComResumoImportacoes } from "../../types/fornecedores.types";
import type { PreviewSincronizacaoFornecedor } from "../../types/fornecedores.types";

type ImportacaoFornecedorAdmin = {
  id: string;
  nomeFornecedor: string;
  nomeArquivo: string | null;
  totalLinhas: number;
  totalProcessadas: number;
  totalErros: number;
  status: string;
  criadoEm: Date;
};

type LinhaStagingFornecedorAdmin = {
  id: string;
  codigoFornecedor: string | null;
  nomeProduto: string;
  categoriaFornecedor: string | null;
  precoFornecedor: string | null;
  precoOriginal: string | null;
  precoCalculado: string | null;
  origemAjuste: string;
  estoqueFornecedor: number | null;
  produtoLocalizadoId: string | null;
  criterioLocalizacao: string | null;
  produtoVinculadoNome: string | null;
  produtoVinculadoSku: string | null;
  status: string;
  errosValidacao: Array<{ codigo: string; mensagem: string; campo?: string }>;
};

type ProdutoParaVinculoFornecedorAdmin = {
  id: string;
  nome: string;
  sku: string;
  slug: string;
};

type AbaConferenciaFornecedor =
  | "todos"
  | "localizado"
  | "nao_localizado"
  | "erro";

type PaginaImportacoesFornecedoresAdminProps = {
  fornecedores: FornecedorComResumoImportacoes[];
  importacoes: ImportacaoFornecedorAdmin[];
  staging: LinhaStagingFornecedorAdmin[];
  importacaoSelecionadaId?: string;
  abaSelecionada: AbaConferenciaFornecedor;
  vincularStagingId?: string;
  buscaProduto: string;
  produtosParaVinculo: ProdutoParaVinculoFornecedorAdmin[];
  previewSincronizacao: PreviewSincronizacaoFornecedor | null;
};

const estilosStatus = {
  ativo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inativo: "bg-slate-50 text-slate-700 border-slate-200",
  pendente: "bg-amber-50 text-amber-700 border-amber-200",
} as const;

function formatarMoedaFornecedor(valor: string | null) {
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
  origem: "arquivo" | "loja" | "importação";
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

export function PaginaImportacoesFornecedoresAdmin({
  fornecedores,
  importacoes,
  staging,
  importacaoSelecionadaId,
  abaSelecionada,
  vincularStagingId,
  buscaProduto,
  produtosParaVinculo,
  previewSincronizacao,
}: PaginaImportacoesFornecedoresAdminProps) {
  const fornecedoresOrdenados = ordenarFornecedoresPorStatusENome(fornecedores);
  const importacaoSelecionada = importacoes.find(
    (importacao) => importacao.id === importacaoSelecionadaId,
  );
  const resumoConferencia = {
    totalImportado: staging.length,
    totalEncontrados: staging.filter((linha) => linha.status === "localizado")
      .length,
    totalNaoEncontrados: staging.filter(
      (linha) => linha.status === "nao_localizado",
    ).length,
    totalErros: staging.filter((linha) => linha.status === "erro").length,
  };
  const stagingFiltrado =
    abaSelecionada === "todos"
      ? staging
      : staging.filter((linha) => linha.status === abaSelecionada);
  const abas = [
    { valor: "todos", label: "Todos" },
    { valor: "localizado", label: "Encontrados" },
    { valor: "nao_localizado", label: "Não encontrados" },
    { valor: "erro", label: "Erros" },
  ] as const;
  const categoriasFornecedor = Array.from(
    new Set(
      staging
        .map((linha) => linha.categoriaFornecedor?.trim())
        .filter((categoria): categoria is string => Boolean(categoria)),
    ),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const produtosImportadosParaAjuste = staging.filter((linha) =>
    Boolean(linha.precoOriginal ?? linha.precoFornecedor),
  );
  const montarUrlConferencia = (
    parametros: Record<string, string | undefined>,
  ) =>
    `/admin/fornecedores/importacoes?${new URLSearchParams({
      ...(importacaoSelecionadaId
        ? { importacaoId: importacaoSelecionadaId }
        : {}),
      aba: abaSelecionada,
      ...parametros,
    }).toString()}`;
  const rotulosSituacaoPreview = {
    pronto_para_sincronizar: "Pronto",
    pendente_vinculacao: "Pendente vinculação",
    bloqueado: "Bloqueado",
  } as const;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">
            Fornecedores
          </h1>
          <p className="text-sm text-slate-600">Importações</p>
        </div>

        <Button asChild variant="outline">
          <a href="#nova-importacao">
            <Upload className="mr-2 h-4 w-4" />
            Nova importação
          </a>
        </Button>
      </div>

      <Card id="nova-importacao" className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg">Nova importação</CardTitle>
          <CardDescription>
            Envie arquivos .xlsx, .xls ou .csv para staging.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={importarPlanilhaFornecedor}
            className="grid gap-4 md:grid-cols-[minmax(220px,1fr)_minmax(260px,1.4fr)_auto]"
          >
            <select
              name="fornecedorId"
              required
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
            >
              <option value="">Selecione o fornecedor</option>
              {fornecedoresOrdenados.map((fornecedor) => (
                <option key={fornecedor.id} value={fornecedor.id}>
                  {fornecedor.nome}
                </option>
              ))}
            </select>
            <input
              name="arquivo"
              type="file"
              required
              accept=".xlsx,.xls,.csv"
              className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
            <Button type="submit">
              <Upload className="mr-2 h-4 w-4" />
              Enviar
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardDescription>Total importado</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {resumoConferencia.totalImportado ||
                importacaoSelecionada?.totalLinhas ||
                0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardDescription>Encontrados</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {resumoConferencia.totalEncontrados}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardDescription>Não encontrados</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {resumoConferencia.totalNaoEncontrados}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardDescription>Erros</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {resumoConferencia.totalErros ||
                importacaoSelecionada?.totalErros ||
                0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg">Fornecedores cadastrados</CardTitle>
          <CardDescription>
            Base inicial para importações por arquivo Excel ou API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Tipo de integração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Importações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fornecedoresOrdenados.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-sm text-slate-500"
                    >
                      Nenhum fornecedor cadastrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  fornecedoresOrdenados.map((fornecedor) => (
                    <TableRow key={fornecedor.id}>
                      <TableCell className="min-w-48 font-medium">
                        {fornecedor.nome}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-slate-500" />
                          {
                            rotulosTipoIntegracaoFornecedor[
                              fornecedor.tipoIntegracao
                            ]
                          }
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={estilosStatus[fornecedor.status]}
                        >
                          {rotulosStatusFornecedor[fornecedor.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fornecedor.totalImportacoes}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <a href="#nova-importacao">
                              <Plus className="mr-2 h-4 w-4" />
                              Nova importação
                            </a>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link href="/admin/fornecedores/importacoes">
                              <History className="mr-2 h-4 w-4" />
                              Ver importações
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg">Importações</CardTitle>
          <CardDescription>
            Histórico inicial de arquivos enviados para staging.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Linhas</TableHead>
                  <TableHead className="text-right">Erros</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importacoes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-20 text-center text-sm text-slate-500"
                    >
                      Nenhuma importação enviada.
                    </TableCell>
                  </TableRow>
                ) : (
                  importacoes.map((importacao) => (
                    <TableRow key={importacao.id}>
                      <TableCell className="font-medium">
                        {importacao.nomeFornecedor}
                      </TableCell>
                      <TableCell>{importacao.nomeArquivo ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{importacao.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {importacao.totalLinhas}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {importacao.totalErros}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" asChild>
                          <Link
                            href={`/admin/fornecedores/importacoes?importacaoId=${importacao.id}`}
                          >
                            Ver importações
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Conferência</CardTitle>
              <CardDescription>
                Dados lidos da planilha antes de qualquer homologação.
              </CardDescription>
            </div>
            {importacaoSelecionadaId ? (
              <form action={analisarImportacaoFornecedor}>
                <input
                  type="hidden"
                  name="importacaoId"
                  value={importacaoSelecionadaId}
                />
                <Button type="submit" size="sm" variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Conferir importação
                </Button>
              </form>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {importacaoSelecionadaId ? (
            <section className="rounded-lg border border-slate-200 p-4">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-slate-950">
                  Ajuste de preço
                </h2>
                <p className="text-sm text-slate-600">
                  Regras aplicadas apenas ao staging desta importação.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <form
                  action={salvarAjustePrecoImportacao}
                  className="space-y-3 rounded-md border border-slate-200 p-3"
                >
                  <input
                    type="hidden"
                    name="importacaoId"
                    value={importacaoSelecionadaId}
                  />
                  <input type="hidden" name="escopoAjuste" value="global" />
                  <p className="text-sm font-medium text-slate-900">
                    Ajuste global
                  </p>
                  <select
                    name="tipoAjuste"
                    required
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="percentual">Percentual</option>
                    <option value="valor_fixo">Valor fixo</option>
                  </select>
                  <input
                    name="valorAjuste"
                    required
                    placeholder="+10, -5, 20"
                    className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                  />
                  <Button type="submit" className="w-full">
                    Aplicar global
                  </Button>
                </form>

                <form
                  action={salvarAjustePrecoImportacao}
                  className="space-y-3 rounded-md border border-slate-200 p-3"
                >
                  <input
                    type="hidden"
                    name="importacaoId"
                    value={importacaoSelecionadaId}
                  />
                  <input type="hidden" name="escopoAjuste" value="categoria" />
                  <p className="text-sm font-medium text-slate-900">
                    Ajuste por categoria
                  </p>
                  <select
                    name="categoriaFornecedor"
                    required
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="">Selecione a categoria</option>
                    {categoriasFornecedor.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                  </select>
                  <select
                    name="tipoAjuste"
                    required
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="percentual">Percentual</option>
                    <option value="valor_fixo">Valor fixo</option>
                  </select>
                  <input
                    name="valorAjuste"
                    required
                    placeholder="+10, -5, 20"
                    className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={categoriasFornecedor.length === 0}
                  >
                    Aplicar categoria
                  </Button>
                </form>

                <form
                  action={salvarAjustePrecoImportacao}
                  className="space-y-3 rounded-md border border-slate-200 p-3"
                >
                  <input
                    type="hidden"
                    name="importacaoId"
                    value={importacaoSelecionadaId}
                  />
                  <input type="hidden" name="escopoAjuste" value="produto" />
                  <p className="text-sm font-medium text-slate-900">
                    Ajuste individual
                  </p>
                  <select
                    name="produtoStagingId"
                    required
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="">Selecione o produto importado</option>
                    {produtosImportadosParaAjuste.map((linha) => (
                      <option key={linha.id} value={linha.id}>
                        {linha.codigoFornecedor ?? "sem codigo"} -{" "}
                        {linha.nomeProduto}
                      </option>
                    ))}
                  </select>
                  <select
                    name="tipoAjuste"
                    required
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="percentual">Percentual</option>
                    <option value="valor_fixo">Valor fixo</option>
                  </select>
                  <input
                    name="valorAjuste"
                    required
                    placeholder="+10, -5, 20"
                    className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={produtosImportadosParaAjuste.length === 0}
                  >
                    Aplicar produto
                  </Button>
                </form>
              </div>
            </section>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {abas.map((aba) => (
              <Button
                key={aba.valor}
                size="sm"
                variant={abaSelecionada === aba.valor ? "default" : "outline"}
                asChild
              >
                <Link
                  href={`/admin/fornecedores/importacoes?${new URLSearchParams({
                    ...(importacaoSelecionadaId
                      ? { importacaoId: importacaoSelecionadaId }
                      : {}),
                    aba: aba.valor,
                  }).toString()}`}
                >
                  {aba.label}
                </Link>
              </Button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <RotuloOrigem campo="Código" origem="arquivo" />
                  </TableHead>
                  <TableHead>
                    <RotuloOrigem campo="Nome" origem="arquivo" />
                  </TableHead>
                  <TableHead>
                    <RotuloOrigem campo="Categoria" origem="arquivo" />
                  </TableHead>
                  <TableHead className="text-right">
                    <RotuloOrigem
                      campo="Preço"
                      origem="arquivo"
                      alinhar="right"
                    />
                  </TableHead>
                  <TableHead className="text-right">Preço calculado</TableHead>
                  <TableHead>Origem ajuste</TableHead>
                  <TableHead className="text-right">
                    <RotuloOrigem
                      campo="Estoque"
                      origem="arquivo"
                      alinhar="right"
                    />
                  </TableHead>
                  <TableHead>
                    <RotuloOrigem campo="Produto" origem="loja" />
                  </TableHead>
                  <TableHead>Critério</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Erro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stagingFiltrado.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={12}
                      className="h-20 text-center text-sm text-slate-500"
                    >
                      Nenhum item em staging.
                    </TableCell>
                  </TableRow>
                ) : (
                  stagingFiltrado.map((linha) => (
                    <Fragment key={linha.id}>
                      <TableRow>
                        <TableCell>{linha.codigoFornecedor ?? "-"}</TableCell>
                        <TableCell className="min-w-56 font-medium">
                          {linha.nomeProduto || "-"}
                        </TableCell>
                        <TableCell>
                          {linha.categoriaFornecedor ?? "-"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatarMoedaFornecedor(linha.precoFornecedor)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatarMoedaFornecedor(linha.precoCalculado)}
                        </TableCell>
                        <TableCell>{linha.origemAjuste}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {linha.estoqueFornecedor ?? "-"}
                        </TableCell>
                        <TableCell className="min-w-56">
                          {linha.produtoVinculadoNome ? (
                            <span className="flex flex-col">
                              <span className="font-medium">
                                {linha.produtoVinculadoNome}
                              </span>
                              <span className="text-xs text-slate-500">
                                SKU {linha.produtoVinculadoSku}
                              </span>
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {linha.criterioLocalizacao ?? "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{linha.status}</Badge>
                        </TableCell>
                        <TableCell className="max-w-72 text-xs text-slate-600">
                          {linha.errosValidacao[0]?.mensagem ?? "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {linha.status === "nao_localizado" ? (
                            <Button size="sm" variant="outline" asChild>
                              <Link
                                href={montarUrlConferencia({
                                  aba: "nao_localizado",
                                  vincularStagingId: linha.id,
                                  buscaProduto: linha.nomeProduto,
                                })}
                              >
                                Vincular produto
                              </Link>
                            </Button>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                      {vincularStagingId === linha.id ? (
                        <TableRow>
                          <TableCell colSpan={12} className="bg-slate-50">
                            <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
                              <form
                                method="get"
                                action="/admin/fornecedores/importacoes"
                                className="flex flex-col gap-2 sm:flex-row"
                              >
                                {importacaoSelecionadaId ? (
                                  <input
                                    type="hidden"
                                    name="importacaoId"
                                    value={importacaoSelecionadaId}
                                  />
                                ) : null}
                                <input
                                  type="hidden"
                                  name="aba"
                                  value="nao_localizado"
                                />
                                <input
                                  type="hidden"
                                  name="vincularStagingId"
                                  value={linha.id}
                                />
                                <input
                                  name="buscaProduto"
                                  defaultValue={buscaProduto}
                                  className="h-10 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
                                  placeholder="Buscar produto por nome, SKU ou slug"
                                />
                                <Button type="submit" variant="outline">
                                  <Search className="mr-2 h-4 w-4" />
                                  Buscar
                                </Button>
                              </form>

                              <form
                                action={vincularProdutoFornecedor}
                                className="flex flex-col gap-2 sm:flex-row"
                              >
                                <input
                                  type="hidden"
                                  name="stagingId"
                                  value={linha.id}
                                />
                                <select
                                  name="produtoId"
                                  required
                                  className="h-10 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
                                >
                                  <option value="">
                                    Selecione um produto existente
                                  </option>
                                  {produtosParaVinculo.map((produto) => (
                                    <option key={produto.id} value={produto.id}>
                                      {produto.nome} - SKU {produto.sku}
                                    </option>
                                  ))}
                                </select>
                                <Button
                                  type="submit"
                                  disabled={produtosParaVinculo.length === 0}
                                >
                                  Salvar vínculo
                                </Button>
                              </form>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {previewSincronizacao ? (
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="text-lg">Preview da sincronização</CardTitle>
            <CardDescription>
              Simulação segura do que poderá ser sincronizado futuramente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="rounded-lg">
                <CardHeader className="pb-2">
                  <CardDescription>Total importado</CardDescription>
                  <CardTitle className="text-2xl tabular-nums">
                    {previewSincronizacao.resumo.totalImportado}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="rounded-lg">
                <CardHeader className="pb-2">
                  <CardDescription>Prontos para sincronizar</CardDescription>
                  <CardTitle className="text-2xl tabular-nums">
                    {previewSincronizacao.resumo.totalProntosParaSincronizar}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="rounded-lg">
                <CardHeader className="pb-2">
                  <CardDescription>Pendentes de vinculação</CardDescription>
                  <CardTitle className="text-2xl tabular-nums">
                    {previewSincronizacao.resumo.totalPendentesVinculacao}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="rounded-lg">
                <CardHeader className="pb-2">
                  <CardDescription>Com erro</CardDescription>
                  <CardTitle className="text-2xl tabular-nums">
                    {previewSincronizacao.resumo.totalComErro}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <RotuloOrigem campo="Código" origem="arquivo" />
                    </TableHead>
                    <TableHead>
                      <RotuloOrigem campo="Nome" origem="arquivo" />
                    </TableHead>
                    <TableHead>
                      <RotuloOrigem campo="Produto" origem="loja" />
                    </TableHead>
                    <TableHead>
                      <RotuloOrigem campo="SKU" origem="loja" />
                    </TableHead>
                    <TableHead className="text-right">
                      <RotuloOrigem
                        campo="Preço"
                        origem="arquivo"
                        alinhar="right"
                      />
                    </TableHead>
                    <TableHead className="text-right">
                      Preço calculado
                    </TableHead>
                    <TableHead className="text-right">
                      <RotuloOrigem
                        campo="Preço"
                        origem="loja"
                        alinhar="right"
                      />
                    </TableHead>
                    <TableHead className="text-right">Diferença</TableHead>
                    <TableHead className="text-right">
                      <RotuloOrigem
                        campo="Estoque"
                        origem="arquivo"
                        alinhar="right"
                      />
                    </TableHead>
                    <TableHead>Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewSincronizacao.itens.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="h-20 text-center text-sm text-slate-500"
                      >
                        Nenhum item para preview.
                      </TableCell>
                    </TableRow>
                  ) : (
                    previewSincronizacao.itens.map((item) => (
                      <TableRow key={item.stagingId}>
                        <TableCell>{item.codigoFornecedor ?? "-"}</TableCell>
                        <TableCell className="min-w-56 font-medium">
                          {item.nomeProdutoFornecedor}
                        </TableCell>
                        <TableCell className="min-w-56">
                          {item.produtoVinculadoNome ?? "-"}
                        </TableCell>
                        <TableCell>{item.sku ?? "-"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatarMoedaFornecedor(item.precoFornecedor)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatarMoedaFornecedor(item.precoCalculado)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatarMoedaFornecedor(item.precoAtualLoja)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatarMoedaFornecedor(item.diferencaPreco)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {item.estoqueFornecedor ?? "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {rotulosSituacaoPreview[item.situacao]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
