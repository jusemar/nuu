import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Filter,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { importarPlanilhaFornecedor } from "../../actions";
import {
  ordenarFornecedoresPorStatusENome,
  rotulosStatusFornecedor,
  rotulosTipoIntegracaoFornecedor,
} from "../../services/fornecedores.service";
import type { FornecedorComResumoImportacoes } from "../../types/fornecedores.types";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type ImportacaoFornecedorRecenteAdmin = {
  id: string;
  nomeFornecedor: string;
  nomeArquivo: string | null;
  totalLinhas: number;
  totalProcessadas: number;
  totalErros: number;
  status: string;
  criadoEm: Date;
};

type PaginacaoImportacoesRecentes = {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
};

type PaginaListaImportacoesFornecedoresAdminProps = {
  fornecedores: FornecedorComResumoImportacoes[];
  importacoesRecentes: ImportacaoFornecedorRecenteAdmin[];
  paginacaoImportacoesRecentes: PaginacaoImportacoesRecentes;
  totaisStatusImportacoesRecentes: Record<string, number>;
};

const estilosStatusFornecedor = {
  ativo: "border-emerald-200 bg-emerald-50 text-emerald-700",
  inativo: "border-slate-200 bg-slate-50 text-slate-700",
  pendente: "border-amber-200 bg-amber-50 text-amber-700",
} as const;

const estilosStatusImportacao = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
  avisos: "border-amber-200 bg-amber-50 text-amber-700",
  pendente: "border-slate-200 bg-slate-100 text-slate-700",
  em_homologacao: "border-amber-200 bg-amber-50 text-amber-700",
  em_staging: "border-sky-200 bg-sky-50 text-sky-700",
} as const;

function formatarTempoRelativo(data: Date) {
  const agora = new Date();
  const diffMs = agora.getTime() - new Date(data).getTime();
  const diffHoras = Math.round(diffMs / (1000 * 60 * 60));

  if (diffHoras < 24) {
    return `Hoje ${new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(data))}`;
  }

  if (diffHoras < 48) {
    return `Ontem ${new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(data))}`;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(data));
}

function formatarBadgeImportacao(importacao: ImportacaoFornecedorRecenteAdmin) {
  if (importacao.totalErros > 0) {
    return {
      rotulo: `${importacao.totalErros} avisos`,
      classe: estilosStatusImportacao.avisos,
    };
  }

  if (importacao.status === "em_homologacao") {
    return {
      rotulo: "Em homologação",
      classe: estilosStatusImportacao.em_homologacao,
    };
  }

  if (importacao.status === "em_staging") {
    return {
      rotulo: "Em staging",
      classe: estilosStatusImportacao.em_staging,
    };
  }

  if (importacao.status === "pendente") {
    return {
      rotulo: "Pendente",
      classe: estilosStatusImportacao.pendente,
    };
  }

  return {
    rotulo: "OK",
    classe: estilosStatusImportacao.ok,
  };
}

function KPI({
  titulo,
  valor,
  descricao,
  icone,
}: {
  titulo: string;
  valor: string | number;
  descricao: string;
  icone: ReactNode;
}) {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
            {titulo}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {valor}
          </p>
          <p className="mt-1 text-xs text-slate-500">{descricao}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
          {icone}
        </div>
      </CardContent>
    </Card>
  );
}

function ImportacaoNovaDrawer({
  fornecedores,
}: {
  fornecedores: FornecedorComResumoImportacoes[];
}) {
  const fornecedoresOrdenados = ordenarFornecedoresPorStatusENome(fornecedores);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="rounded-full px-4 shadow-sm">
          <Upload className="mr-2 h-4 w-4" />
          Nova importação
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Nova importação</SheetTitle>
          <SheetDescription>
            Selecione o fornecedor e envie a planilha para o staging.
          </SheetDescription>
        </SheetHeader>
        <form action={importarPlanilhaFornecedor} className="mt-6 grid gap-3">
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
          <Button type="submit" className="mt-1">
            <Upload className="mr-2 h-4 w-4" />
            Enviar para staging
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function PaginaListaImportacoesFornecedoresAdmin({
  fornecedores,
  importacoesRecentes,
  paginacaoImportacoesRecentes,
  totaisStatusImportacoesRecentes,
}: PaginaListaImportacoesFornecedoresAdminProps) {
  const fornecedoresOrdenados = ordenarFornecedoresPorStatusENome(fornecedores);
  const totalAtivos = fornecedores.filter(
    (fornecedor) => fornecedor.status === "ativo",
  ).length;
  const totalAtualizados = fornecedores.filter((fornecedor) => {
    if (!fornecedor.ultimaImportacaoEm) return false;
    const diffMs =
      Date.now() - new Date(fornecedor.ultimaImportacaoEm).getTime();
    return diffMs <= 1000 * 60 * 60 * 24 * 30;
  }).length;
  const totalEmAnalise =
    (totaisStatusImportacoesRecentes.em_homologacao ?? 0) +
    (totaisStatusImportacoesRecentes.em_staging ?? 0) +
    (totaisStatusImportacoesRecentes.pendente ?? 0);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-[0.2em] text-slate-500 uppercase">
            Tabela de preços
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Importações de fornecedores
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Suba uma planilha, acompanhe o processamento e navegue entre
            fornecedores e importações recentes em um painel operacional.
          </p>
        </div>
        <ImportacaoNovaDrawer fornecedores={fornecedores} />
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KPI
          titulo="Fornecedores"
          valor={fornecedores.length}
          descricao="cadastros ativos no domínio"
          icone={<Building2 className="h-5 w-5" />}
        />
        <KPI
          titulo="Ativos"
          valor={totalAtivos}
          descricao="prontos para novas importações"
          icone={<CheckCircle2 className="h-5 w-5" />}
        />
        <KPI
          titulo="Atualizados"
          valor={totalAtualizados}
          descricao="com importação recente processada"
          icone={<Clock3 className="h-5 w-5" />}
        />
        <KPI
          titulo="Em análise"
          valor={totalEmAnalise}
          descricao="pendentes, staging ou homologação"
          icone={<AlertTriangle className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Fornecedores</CardTitle>
                <CardDescription>
                  Selecione para importar uma nova lista
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9"
                aria-label="Filtrar fornecedores"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {fornecedoresOrdenados.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">
                  Nenhum fornecedor cadastrado.
                </div>
              ) : (
                fornecedoresOrdenados.map((fornecedor) => (
                  <Link
                    key={fornecedor.id}
                    href="/admin/fornecedores"
                    className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50/80"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-950">
                          {fornecedor.nome}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{fornecedor.totalImportacoes} importações</span>
                        <span>•</span>
                        <span>
                          {fornecedor.ultimaImportacaoEm
                            ? `Última ${formatarTempoRelativo(
                                fornecedor.ultimaImportacaoEm,
                              )}`
                            : "Sem importação"}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        {
                          rotulosTipoIntegracaoFornecedor[
                            fornecedor.tipoIntegracao
                          ]
                        }
                      </span>
                      <Badge
                        variant="outline"
                        className={estilosStatusFornecedor[fornecedor.status]}
                      >
                        {rotulosStatusFornecedor[fornecedor.status]}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg">Importações recentes</CardTitle>
            <CardDescription>
              Últimos envios processados no fluxo.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {importacoesRecentes.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">
                  Nenhuma importação enviada.
                </div>
              ) : (
                importacoesRecentes.map((importacao) => {
                  const badge = formatarBadgeImportacao(importacao);

                  return (
                    <Link
                      key={importacao.id}
                      href={`/admin/fornecedores/importacoes/${importacao.id}`}
                      className="group flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50/80"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-slate-400" />
                          <span className="truncate text-sm font-semibold text-slate-950">
                            {importacao.nomeArquivo ?? "Arquivo sem nome"}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm text-slate-600">
                          {importacao.nomeFornecedor}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {importacao.totalLinhas} linhas •{" "}
                          {importacao.totalProcessadas} válidos •{" "}
                          {importacao.totalErros} erros •{" "}
                          {formatarTempoRelativo(importacao.criadoEm)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant="outline" className={badge.classe}>
                          {badge.rotulo}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>Página {paginacaoImportacoesRecentes.pagina}</span>
                <span>•</span>
                <span>{paginacaoImportacoesRecentes.totalPaginas} páginas</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={paginacaoImportacoesRecentes.pagina <= 1}
                  asChild={paginacaoImportacoesRecentes.pagina > 1}
                >
                  {paginacaoImportacoesRecentes.pagina > 1 ? (
                    <Link
                      href={`/admin/fornecedores/importacoes?pagina=${
                        paginacaoImportacoesRecentes.pagina - 1
                      }&limite=${paginacaoImportacoesRecentes.limite}`}
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
                  disabled={
                    paginacaoImportacoesRecentes.pagina >=
                    paginacaoImportacoesRecentes.totalPaginas
                  }
                  asChild={
                    paginacaoImportacoesRecentes.pagina <
                    paginacaoImportacoesRecentes.totalPaginas
                  }
                >
                  {paginacaoImportacoesRecentes.pagina <
                  paginacaoImportacoesRecentes.totalPaginas ? (
                    <Link
                      href={`/admin/fornecedores/importacoes?pagina=${
                        paginacaoImportacoesRecentes.pagina + 1
                      }&limite=${paginacaoImportacoesRecentes.limite}`}
                    >
                      Próxima
                    </Link>
                  ) : (
                    "Próxima"
                  )}
                </Button>
                <form action="/admin/fornecedores/importacoes" className="flex">
                  <input type="hidden" name="pagina" value={1} />
                  <select
                    name="limite"
                    defaultValue={paginacaoImportacoesRecentes.limite}
                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="4">4</option>
                    <option value="8">8</option>
                    <option value="12">12</option>
                  </select>
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    className="ml-2"
                  >
                    Ir
                  </Button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardContent className="grid gap-4 p-4 text-xs text-slate-600 sm:grid-cols-2 xl:grid-cols-5">
          <div>
            <span className="font-medium text-amber-700">Em homologação:</span>{" "}
            importação em revisão antes de sincronizar.
          </div>
          <div>
            <span className="font-medium text-sky-700">Em staging:</span> dados
            importados aguardando validação.
          </div>
          <div>
            <span className="font-medium text-emerald-700">OK:</span> importação
            sem avisos relevantes.
          </div>
          <div>
            <span className="font-medium text-amber-700">Com avisos:</span>{" "}
            itens com alertas ou inconsistências.
          </div>
          <div>
            <span className="font-medium text-slate-700">Pendente:</span>{" "}
            importação aguardando próxima etapa.
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
