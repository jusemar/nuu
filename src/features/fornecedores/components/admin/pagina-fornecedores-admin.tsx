import {
  FileSpreadsheet,
  Link2,
  PackageSearch,
  Plug,
  Power,
  PowerOff,
  Save,
  Search,
} from "lucide-react";
import Link from "next/link";

import {
  alterarStatusVinculoProdutoFornecedor,
  salvarFornecedor,
  salvarVinculoProdutoFornecedorManual,
} from "../../actions";
import type { ConfiguracaoLaquilaAdmin } from "../../integracoes/laquila/types";
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

import {
  ordenarFornecedoresPorStatusENome,
  rotulosStatusFornecedor,
  rotulosTipoIntegracaoFornecedor,
} from "../../services/fornecedores.service";
import type {
  FornecedorComResumoImportacoes,
  ProdutoParaVinculoFornecedor,
  ProdutoVinculadoFornecedorAdmin,
} from "../../types/fornecedores.types";

import { AlternarStatusFornecedor } from "./alternar-status-fornecedor";
import { FormularioConfiguracaoLaquila } from "../../integracoes/laquila/components/admin/formulario-configuracao-laquila";

type PaginaFornecedoresAdminProps = {
  fornecedores: FornecedorComResumoImportacoes[];
  vinculosProdutos?: ProdutoVinculadoFornecedorAdmin[];
  produtosParaVinculo?: ProdutoParaVinculoFornecedor[];
  fornecedorBuscaProdutoId?: string | null;
  buscaProdutoVinculo?: string;
  configuracaoLaquila?: ConfiguracaoLaquilaAdmin | null;
};

const estilosEstado = {
  sucesso: {
    ponto: "bg-emerald-500",
    texto: "text-emerald-700",
  },
  erro: {
    ponto: "bg-red-500",
    texto: "text-red-700",
  },
  alerta: {
    ponto: "bg-amber-500",
    texto: "text-amber-700",
  },
  neutro: {
    ponto: "bg-slate-400",
    texto: "text-slate-600",
  },
} as const;

function formatarDataCurta(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(data);
}

function obterEstadoFornecedor(fornecedor: FornecedorComResumoImportacoes) {
  if (fornecedor.tipoIntegracao === "api") {
    const integracao = fornecedor.integracaoApi;

    if (!integracao || !integracao.tokenConfigurado) {
      return {
        titulo: "Conexão",
        rotulo: "Configurar",
        tom: "alerta" as const,
      };
    }

    if (integracao.ultimoTesteStatus === "sucesso") {
      return {
        titulo: "Conexão",
        rotulo: "Conectado",
        tom: "sucesso" as const,
      };
    }

    if (integracao.ultimoTesteStatus === "erro") {
      return {
        titulo: "Conexão",
        rotulo: "Erro",
        tom: "erro" as const,
      };
    }

    return {
      titulo: "Conexão",
      rotulo: "Nunca testado",
      tom: "alerta" as const,
    };
  }

  if (!fornecedor.ultimaImportacaoStatus) {
    return {
      titulo: "Importação",
      rotulo: "Nunca importado",
      tom: "alerta" as const,
    };
  }

  if (fornecedor.ultimaImportacaoStatus === "aprovada") {
    return {
      titulo: "Importação",
      rotulo: "Importado",
      tom: "sucesso" as const,
    };
  }

  if (
    fornecedor.ultimaImportacaoStatus === "erro" ||
    fornecedor.ultimaImportacaoStatus === "rejeitada"
  ) {
    return {
      titulo: "Importação",
      rotulo: "Erro",
      tom: "erro" as const,
    };
  }

  return {
    titulo: "Importação",
    rotulo: "Aguardando",
    tom: "alerta" as const,
  };
}

export function PaginaFornecedoresAdmin({
  fornecedores,
  vinculosProdutos = [],
  produtosParaVinculo = [],
  fornecedorBuscaProdutoId = null,
  buscaProdutoVinculo = "",
  configuracaoLaquila = null,
}: PaginaFornecedoresAdminProps) {
  const fornecedoresOrdenados = ordenarFornecedoresPorStatusENome(fornecedores);
  const vinculosPorFornecedor = new Map<
    string,
    ProdutoVinculadoFornecedorAdmin[]
  >();

  for (const vinculo of vinculosProdutos) {
    const vinculosFornecedor =
      vinculosPorFornecedor.get(vinculo.fornecedorId) ?? [];
    vinculosFornecedor.push(vinculo);
    vinculosPorFornecedor.set(vinculo.fornecedorId, vinculosFornecedor);
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">
            Fornecedores
          </h1>
          <p className="text-sm text-slate-600">Origens, arquivos e APIs.</p>
        </div>

        <Button asChild variant="outline">
          <Link href="/admin/fornecedores/importacoes">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Importações
          </Link>
        </Button>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg">Novo fornecedor</CardTitle>
          <CardDescription>Cadastre uma origem.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={salvarFornecedor}
            className="grid gap-4 md:grid-cols-[minmax(240px,1fr)_180px_160px_auto]"
          >
            <input
              name="nome"
              required
              minLength={2}
              maxLength={160}
              placeholder="Nome do fornecedor"
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
            />
            <select
              name="tipoIntegracao"
              required
              defaultValue="arquivo_excel"
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
            >
              <option value="arquivo_excel">Arquivo Excel</option>
              <option value="api">API</option>
            </select>
            <select
              name="status"
              required
              defaultValue="ativo"
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Criar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg">Fornecedores cadastrados</CardTitle>
          <CardDescription>Operação e integrações.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fornecedoresOrdenados.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-20 text-center text-sm text-slate-500"
                    >
                      Nenhum fornecedor cadastrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  fornecedoresOrdenados.map((fornecedor) => {
                    const estado = obterEstadoFornecedor(fornecedor);
                    const estiloEstado = estilosEstado[estado.tom];
                    const configuracaoFornecedor =
                      fornecedor.integracaoApi?.provedor === "laquila"
                        ? {
                            ...fornecedor.integracaoApi,
                            nomeFornecedor: fornecedor.nome,
                          }
                        : configuracaoLaquila?.fornecedorId === fornecedor.id
                          ? configuracaoLaquila
                          : null;
                    const vinculosFornecedor =
                      vinculosPorFornecedor.get(fornecedor.id) ?? [];

                    return (
                      <TableRow key={fornecedor.id} className="align-top">
                        <TableCell className="min-w-[300px]">
                          <form
                            id={`editar-fornecedor-${fornecedor.id}`}
                            action={salvarFornecedor}
                            className="grid gap-2"
                          >
                            <input
                              type="hidden"
                              name="id"
                              value={fornecedor.id}
                            />
                            <input
                              name="nome"
                              required
                              minLength={2}
                              maxLength={160}
                              defaultValue={fornecedor.nome}
                              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
                            />
                            <input
                              type="hidden"
                              name="tipoIntegracao"
                              value={fornecedor.tipoIntegracao}
                            />
                            <p className="text-xs font-medium text-slate-500">
                              {
                                rotulosTipoIntegracaoFornecedor[
                                  fornecedor.tipoIntegracao
                                ]
                              }
                            </p>
                          </form>
                        </TableCell>
                        <TableCell>
                          <div className="flex min-w-28 items-center gap-3">
                            <AlternarStatusFornecedor fornecedor={fornecedor} />
                            <span className="text-sm font-medium text-slate-900">
                              {rotulosStatusFornecedor[fornecedor.status]}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="min-w-40">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2 w-2 rounded-full ${estiloEstado.ponto}`}
                              />
                              <span className="text-xs text-slate-500">
                                {estado.titulo}:
                              </span>
                              <span
                                className={`text-sm font-medium ${estiloEstado.texto}`}
                              >
                                {estado.rotulo}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="submit"
                                  size="icon"
                                  variant="ghost"
                                  form={`editar-fornecedor-${fornecedor.id}`}
                                  aria-label="Salvar alterações"
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Salvar alterações</TooltipContent>
                            </Tooltip>

                            <Sheet
                              defaultOpen={
                                fornecedorBuscaProdutoId === fornecedor.id
                              }
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <SheetTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      aria-label="Produtos vinculados"
                                    >
                                      <Link2 className="h-4 w-4" />
                                    </Button>
                                  </SheetTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Produtos vinculados
                                </TooltipContent>
                              </Tooltip>
                              <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-3xl">
                                <SheetHeader className="border-b px-5 py-4 text-left">
                                  <SheetTitle>Produtos vinculados</SheetTitle>
                                  <SheetDescription>
                                    {fornecedor.nome}
                                  </SheetDescription>
                                </SheetHeader>

                                <div className="grid gap-5 px-5 pb-6">
                                  <section className="rounded-lg border border-slate-200 bg-white p-4">
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                      <div>
                                        <h3 className="text-sm font-semibold text-slate-950">
                                          Adicionar vínculo
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                          Busque um produto existente da loja.
                                        </p>
                                      </div>
                                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                                        {vinculosFornecedor.length} vínculos
                                      </span>
                                    </div>

                                    <form
                                      action="/admin/fornecedores"
                                      className="grid gap-2 sm:grid-cols-[1fr_auto]"
                                    >
                                      <input
                                        type="hidden"
                                        name="fornecedorVinculoId"
                                        value={fornecedor.id}
                                      />
                                      <input
                                        name="buscaProdutoVinculo"
                                        defaultValue={
                                          fornecedorBuscaProdutoId ===
                                          fornecedor.id
                                            ? buscaProdutoVinculo
                                            : ""
                                        }
                                        placeholder="Buscar por produto, SKU ou marca"
                                        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
                                      />
                                      <Button type="submit" variant="outline">
                                        <Search className="mr-2 h-4 w-4" />
                                        Buscar
                                      </Button>
                                    </form>

                                    {fornecedorBuscaProdutoId ===
                                      fornecedor.id &&
                                      buscaProdutoVinculo && (
                                        <div className="mt-4 grid gap-2">
                                          {produtosParaVinculo.length === 0 ? (
                                            <div className="rounded-md border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                                              Nenhum produto encontrado.
                                            </div>
                                          ) : (
                                            produtosParaVinculo.map(
                                              (produto) => (
                                                <form
                                                  key={produto.id}
                                                  action={
                                                    salvarVinculoProdutoFornecedorManual
                                                  }
                                                  className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-[1fr_180px_auto]"
                                                >
                                                  <input
                                                    type="hidden"
                                                    name="fornecedorId"
                                                    value={fornecedor.id}
                                                  />
                                                  <input
                                                    type="hidden"
                                                    name="produtoId"
                                                    value={produto.id}
                                                  />
                                                  <input
                                                    type="hidden"
                                                    name="status"
                                                    value="ativo"
                                                  />
                                                  <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-slate-950">
                                                      {produto.nome}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                      SKU {produto.sku}
                                                      {produto.marca
                                                        ? ` • ${produto.marca}`
                                                        : ""}
                                                    </p>
                                                  </div>
                                                  <input
                                                    name="codigoFornecedor"
                                                    placeholder="Código fornecedor"
                                                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
                                                  />
                                                  <Button type="submit">
                                                    Vincular
                                                  </Button>
                                                </form>
                                              ),
                                            )
                                          )}
                                        </div>
                                      )}
                                  </section>

                                  <section className="rounded-lg border border-slate-200 bg-white">
                                    <div className="flex items-center justify-between border-b px-4 py-3">
                                      <div>
                                        <h3 className="text-sm font-semibold text-slate-950">
                                          Produtos vinculados
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                          Códigos usados na localização
                                          automática das importações.
                                        </p>
                                      </div>
                                      <PackageSearch className="h-4 w-4 text-slate-400" />
                                    </div>

                                    {vinculosFornecedor.length === 0 ? (
                                      <div className="p-6 text-sm text-slate-500">
                                        Nenhum produto vinculado a este
                                        fornecedor.
                                      </div>
                                    ) : (
                                      <div className="overflow-x-auto">
                                        <Table className="min-w-[760px]">
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Produto</TableHead>
                                              <TableHead>SKU loja</TableHead>
                                              <TableHead>
                                                Código fornecedor
                                              </TableHead>
                                              <TableHead>Status</TableHead>
                                              <TableHead>Atualizado</TableHead>
                                              <TableHead className="text-right">
                                                Ações
                                              </TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {vinculosFornecedor.map(
                                              (vinculo) => (
                                                <TableRow key={vinculo.id}>
                                                  <TableCell className="max-w-[240px]">
                                                    <p className="truncate text-sm font-medium text-slate-950">
                                                      {vinculo.produtoNome}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                      {vinculo.produtoMarca ??
                                                        "Sem marca"}
                                                    </p>
                                                  </TableCell>
                                                  <TableCell className="text-sm text-slate-600">
                                                    {vinculo.produtoSku}
                                                  </TableCell>
                                                  <TableCell>
                                                    <form
                                                      id={`editar-vinculo-${vinculo.id}`}
                                                      action={
                                                        salvarVinculoProdutoFornecedorManual
                                                      }
                                                      className="flex min-w-44 gap-2"
                                                    >
                                                      <input
                                                        type="hidden"
                                                        name="id"
                                                        value={vinculo.id}
                                                      />
                                                      <input
                                                        type="hidden"
                                                        name="fornecedorId"
                                                        value={fornecedor.id}
                                                      />
                                                      <input
                                                        type="hidden"
                                                        name="produtoId"
                                                        value={
                                                          vinculo.produtoId
                                                        }
                                                      />
                                                      <input
                                                        type="hidden"
                                                        name="status"
                                                        value={vinculo.status}
                                                      />
                                                      <input
                                                        name="codigoFornecedor"
                                                        defaultValue={
                                                          vinculo.codigoFornecedor ??
                                                          ""
                                                        }
                                                        placeholder="Sem código"
                                                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
                                                      />
                                                    </form>
                                                  </TableCell>
                                                  <TableCell>
                                                    <span
                                                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                                                        vinculo.status ===
                                                        "ativo"
                                                          ? "bg-emerald-50 text-emerald-700"
                                                          : "bg-slate-100 text-slate-600"
                                                      }`}
                                                    >
                                                      {vinculo.status ===
                                                      "ativo"
                                                        ? "Ativo"
                                                        : "Inativo"}
                                                    </span>
                                                  </TableCell>
                                                  <TableCell className="text-sm text-slate-500">
                                                    {formatarDataCurta(
                                                      vinculo.atualizadoEm,
                                                    )}
                                                  </TableCell>
                                                  <TableCell>
                                                    <div className="flex justify-end gap-1.5">
                                                      <Tooltip>
                                                        <TooltipTrigger asChild>
                                                          <Button
                                                            type="submit"
                                                            size="icon"
                                                            variant="ghost"
                                                            form={`editar-vinculo-${vinculo.id}`}
                                                            aria-label="Salvar código do fornecedor"
                                                          >
                                                            <Save className="h-4 w-4" />
                                                          </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                          Salvar código
                                                        </TooltipContent>
                                                      </Tooltip>

                                                      <form
                                                        action={
                                                          alterarStatusVinculoProdutoFornecedor
                                                        }
                                                      >
                                                        <input
                                                          type="hidden"
                                                          name="id"
                                                          value={vinculo.id}
                                                        />
                                                        <input
                                                          type="hidden"
                                                          name="fornecedorId"
                                                          value={fornecedor.id}
                                                        />
                                                        <input
                                                          type="hidden"
                                                          name="status"
                                                          value={
                                                            vinculo.status ===
                                                            "ativo"
                                                              ? "inativo"
                                                              : "ativo"
                                                          }
                                                        />
                                                        <Tooltip>
                                                          <TooltipTrigger
                                                            asChild
                                                          >
                                                            <Button
                                                              type="submit"
                                                              size="icon"
                                                              variant="outline"
                                                              aria-label={
                                                                vinculo.status ===
                                                                "ativo"
                                                                  ? "Inativar vínculo"
                                                                  : "Ativar vínculo"
                                                              }
                                                            >
                                                              {vinculo.status ===
                                                              "ativo" ? (
                                                                <PowerOff className="h-4 w-4" />
                                                              ) : (
                                                                <Power className="h-4 w-4" />
                                                              )}
                                                            </Button>
                                                          </TooltipTrigger>
                                                          <TooltipContent>
                                                            {vinculo.status ===
                                                            "ativo"
                                                              ? "Inativar"
                                                              : "Ativar"}
                                                          </TooltipContent>
                                                        </Tooltip>
                                                      </form>
                                                    </div>
                                                  </TableCell>
                                                </TableRow>
                                              ),
                                            )}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    )}
                                  </section>
                                </div>
                              </SheetContent>
                            </Sheet>

                            {fornecedor.tipoIntegracao === "api" && (
                              <Sheet>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <SheetTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        aria-label="Configurar conexão"
                                      >
                                        <Plug className="h-4 w-4" />
                                      </Button>
                                    </SheetTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Configurar conexão
                                  </TooltipContent>
                                </Tooltip>
                                <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-xl">
                                  <SheetHeader className="border-b px-5 py-4 text-left">
                                    <SheetTitle>Conexão</SheetTitle>
                                    <SheetDescription>Laquila</SheetDescription>
                                  </SheetHeader>
                                  <FormularioConfiguracaoLaquila
                                    configuracao={configuracaoFornecedor}
                                    fornecedorId={fornecedor.id}
                                    modo="drawer"
                                  />
                                </SheetContent>
                              </Sheet>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
