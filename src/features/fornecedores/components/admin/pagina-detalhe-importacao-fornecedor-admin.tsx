import {
  ArrowLeft,
  CheckCircle2,
  FilterX,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";

import {
  analisarImportacaoFornecedor,
  aplicarMapeamentoColunasFornecedorAction,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AbaConciliacaoImportacaoFornecedor } from "./aba-conciliacao-importacao-fornecedor";
import { AbaVinculacaoImportacaoFornecedor } from "./aba-vinculacao-importacao-fornecedor";
import {
  type OpcaoValorPadraoLoja,
  TabelaMapeamentoCamposFornecedor,
} from "./tabela-mapeamento-campos-fornecedor";

import type {
  CampoMapeamentoColunaFornecedor,
  ColunaPlanilhaFornecedor,
  PreviewSincronizacaoFornecedor,
  ProdutoParaVinculoFornecedor,
  ResultadoRevisaoImportacaoFornecedor,
} from "../../types/fornecedores.types";

type ImportacaoFornecedorAdmin = {
  id: string;
  fornecedorId: string;
  nomeFornecedor: string;
  tipoIntegracaoFornecedor: string;
  tipoArquivo: string;
  nomeArquivo: string | null;
  totalLinhas: number;
  totalProcessadas: number;
  totalErros: number;
  colunasPlanilha: ColunaPlanilhaFornecedor[];
  mapeamentoColunas: Array<{
    nomeColunaOrigem: string;
    nomeColunaNormalizada: string;
    campoDestino: string | null;
    origem: string | null;
    situacao: string;
  }>;
  status: string;
  criadoEm: Date;
  atualizadoEm: Date;
};

type LinhaStagingFornecedorAdmin = {
  id: string;
  codigoFornecedor: string | null;
  nomeProduto: string;
  categoriaFornecedor: string | null;
  marcaFornecedor: string | null;
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
  buscaRevisao?: string;
  categoriaRevisao?: string;
  marcaRevisao?: string;
  codigoFornecedor?: string;
  categoriaFornecedor?: string;
  marcaFornecedor?: string;
  status?: string;
  vinculo?: string;
  situacaoPreview?: string;
  pagina: number;
  limite: number;
  paginaRevisao: number;
  limiteRevisao: number;
  detalheId?: string;
  vincularStagingId?: string;
  buscaProduto?: string;
};

type PaginaDetalheImportacaoFornecedorAdminProps = {
  importacao: ImportacaoFornecedorAdmin;
  linhas: LinhaStagingFornecedorAdmin[];
  todasLinhas: LinhaStagingFornecedorAdmin[];
  paginacao: PaginacaoFornecedor;
  filtros: FiltrosFornecedor;
  produtosParaVinculo: ProdutoParaVinculoFornecedor[];
  previewSincronizacao: PreviewSincronizacaoFornecedor;
  revisaoImportacao: ResultadoRevisaoImportacaoFornecedor;
  revisaoItens: ResultadoRevisaoImportacaoFornecedor["itens"];
  revisaoTotal: number;
  revisaoPagina: number;
  revisaoTotalPaginas: number;
  categorias: string[];
  marcas: string[];
  categoriaRevisao: string;
  marcaRevisao: string;
  marcasAtivas: Array<{ id: string; nome: string }>;
  categoriasLoja: OpcaoValorPadraoLoja[];
};

const etapas = [
  { valor: "mapeamento", label: "Mapeamento" },
  { valor: "vinculacao", label: "Vinculação" },
  { valor: "revisao", label: "Conciliação" },
  { valor: "preview", label: "Preview" },
] as const;

const camposMapeamento = [
  ["codigo_fornecedor", "Código fornecedor"],
  ["nome_produto", "Nome do produto"],
  ["categoria_fornecedor", "Categoria da loja"],
  ["marca_fornecedor", "Marca da loja"],
  ["preco_fornecedor", "Preço fornecedor"],
  ["estoque_fornecedor", "Estoque fornecedor"],
] satisfies Array<[CampoMapeamentoColunaFornecedor, string]>;

const etapasFluxo = [
  "Selecionar arquivo",
  "Mapear colunas",
  "Vinculação",
  "Conciliação",
  "Preview",
  "Sincronização futura",
];

function formatarMoeda(valor: string | null) {
  if (!valor) return "-";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor));
}

function formatarData(valor: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(valor);
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

function ResumoCompacto({
  importacao,
  previewSincronizacao,
  revisaoImportacao,
}: {
  importacao: ImportacaoFornecedorAdmin;
  previewSincronizacao: PreviewSincronizacaoFornecedor;
  revisaoImportacao: ResultadoRevisaoImportacaoFornecedor;
}) {
  const valorFornecedor = previewSincronizacao.itens.reduce(
    (total, item) => total + Number(item.precoFornecedor ?? 0),
    0,
  );
  const valorAjustado = previewSincronizacao.itens.reduce(
    (total, item) => total + Number(item.precoCalculado ?? 0),
    0,
  );
  const cards = [
    ["Total importado", importacao.totalLinhas],
    ["Localizados", previewSincronizacao.resumo.totalProntosParaSincronizar],
    ["Não localizados", previewSincronizacao.resumo.totalPendentesVinculacao],
    ["Erros", previewSincronizacao.resumo.totalComErro],
    ["Valor fornecedor", formatarMoeda(valorFornecedor.toFixed(2))],
    ["Valor ajustado", formatarMoeda(valorAjustado.toFixed(2))],
    [
      "Diferença total",
      formatarMoeda((valorAjustado - valorFornecedor).toFixed(2)),
    ],
  ];
  const indicadoresRevisao = [
    [
      "Sem categoria",
      revisaoImportacao.resumo.totalSemCategoria,
      "destructive",
    ],
    ["Sem marca", revisaoImportacao.resumo.totalSemMarca, "destructive"],
    ["Sem código", revisaoImportacao.resumo.totalSemCodigo, "destructive"],
    ["Sem nome", revisaoImportacao.resumo.totalSemNome, "destructive"],
    [
      "Preço inválido",
      revisaoImportacao.resumo.totalPrecoInvalido,
      "destructive",
    ],
    ["Produtos OK", revisaoImportacao.resumo.totalProdutosOK, "default"],
  ] as const;

  return (
    <div className="space-y-2">
      <div className="grid gap-1.5 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
        {cards.map(([label, valor]) => (
          <Card key={label} className="rounded-md">
            <CardHeader className="space-y-0.5 p-2.5">
              <CardDescription className="text-[11px] leading-tight">
                {label}
              </CardDescription>
              <CardTitle className="text-base leading-tight tabular-nums">
                {valor}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {indicadoresRevisao.map(([label, valor, variante]) => (
          <Badge
            key={label}
            variant="outline"
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium ${
              variante === "destructive"
                ? "bg-red-50 text-red-700 hover:bg-red-50"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            {label}: {valor}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function CabecalhoExecutivo({
  importacao,
}: {
  importacao: ImportacaoFornecedorAdmin;
}) {
  return (
    <Card className="rounded-lg">
      <CardContent className="grid gap-3 p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">
            Fornecedores &gt; Importações
          </p>
          <h1 className="truncate text-2xl font-semibold text-slate-950">
            Importação #{importacao.id.slice(0, 8)}
          </h1>
          <p className="truncate text-sm text-slate-600">
            {importacao.nomeArquivo ?? "arquivo sem nome"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Fornecedor</p>
          <p className="font-medium">{importacao.nomeFornecedor}</p>
          <p className="text-xs text-slate-500">
            {importacao.tipoIntegracaoFornecedor}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Operação</p>
          <p className="font-medium">{importacao.tipoArquivo}</p>
          <Badge variant="outline" className="mt-1">
            {importacao.status}
          </Badge>
        </div>
        <div>
          <p className="text-xs text-slate-500">Importado em</p>
          <p className="font-medium">{formatarData(importacao.criadoEm)}</p>
          <p className="text-xs text-slate-500">
            Responsável: preparado para futuro
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function StepperImportacao({ etapaAtual }: { etapaAtual: string }) {
  const indiceAtual = Math.max(
    1,
    etapas.findIndex((etapa) => etapa.valor === etapaAtual) + 1,
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex min-w-max items-start">
        {etapasFluxo.map((etapa, indice) => {
          const bloqueado = indice >= 7;
          const atual = indice === indiceAtual;
          const concluido = indice < indiceAtual && !bloqueado;

          return (
            <div
              key={etapa}
              className="flex min-w-[140px] items-start last:min-w-[96px]"
            >
              <div className="flex min-w-0 flex-col items-center text-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium shadow-sm ${
                    atual
                      ? "border-slate-950 bg-slate-950 text-white"
                      : concluido
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-300 bg-white text-slate-400"
                  }`}
                >
                  {concluido ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    indice + 1
                  )}
                </div>
                <p
                  className={`mt-1.5 max-w-[104px] text-[11px] leading-tight font-medium ${
                    atual
                      ? "text-slate-950"
                      : concluido
                        ? "text-slate-700"
                        : "text-slate-400"
                  }`}
                >
                  {etapa}
                </p>
              </div>
              {indice < etapasFluxo.length - 1 ? (
                <div
                  className={`mt-3.5 h-0.5 flex-1 rounded-full ${
                    concluido ? "bg-emerald-600" : "bg-slate-200"
                  }`}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function calcularConfiancaMapeamento(situacao?: string | null) {
  if (situacao === "detectado_automaticamente") return 94;
  if (situacao === "vindo_do_mapeamento_salvo") return 88;
  if (situacao === "confirmado") return 100;
  if (situacao === "conflito") return 42;

  return 18;
}

function AbaMapeamento({
  importacao,
  linhas,
  categoriasLoja,
  marcasAtivas,
}: {
  importacao: ImportacaoFornecedorAdmin;
  linhas: LinhaStagingFornecedorAdmin[];
  categoriasLoja: OpcaoValorPadraoLoja[];
  marcasAtivas: Array<{ id: string; nome: string }>;
}) {
  const mapeamentosPorColuna = new Map(
    importacao.mapeamentoColunas.map((mapeamento) => [
      mapeamento.nomeColunaOrigem,
      mapeamento,
    ]),
  );
  const totalColunasDetectadas = importacao.colunasPlanilha.length;
  const totalMapeadasAutomaticamente = importacao.mapeamentoColunas.filter(
    (mapeamento) => Boolean(mapeamento.campoDestino),
  ).length;
  const totalPendentes = Math.max(
    totalColunasDetectadas - totalMapeadasAutomaticamente,
    0,
  );
  const linhasMapeamento = importacao.colunasPlanilha.map((coluna) => {
    const mapeamento = mapeamentosPorColuna.get(coluna.nomeOriginal);
    const amostra = linhas.find((linha) => {
      const valor = linha.dadosBrutos[coluna.nomeOriginal];

      return valor !== null && valor !== undefined && String(valor).trim();
    })?.dadosBrutos[coluna.nomeOriginal];

    return {
      id: `${coluna.indice}-${coluna.nomeOriginal}`,
      nomeOrigem: coluna.nomeOriginal || `Coluna ${coluna.indice + 1}`,
      descricaoOrigem: `Índice ${coluna.indice + 1}`,
      amostra:
        amostra === null || amostra === undefined ? null : String(amostra),
      campoDestino: mapeamento?.campoDestino ?? null,
      situacao: mapeamento?.situacao ?? "pendente",
      confianca: calcularConfiancaMapeamento(mapeamento?.situacao),
    };
  });

  return (
    <TabelaMapeamentoCamposFornecedor
      tipoOrigem="arquivo"
      titulo="Mapeamento de colunas"
      subtitulo="Revise como cada coluna da planilha será interpretada antes de avançar para vínculos e revisão."
      labelPrimeiraColuna="Coluna na planilha"
      labelAmostra="Amostra"
      linhas={linhasMapeamento}
      opcoesDestino={camposMapeamento.map(([valor, label]) => ({
        valor,
        label,
      }))}
      categoriasLoja={categoriasLoja}
      marcasLoja={marcasAtivas}
      action={aplicarMapeamentoColunasFornecedorAction}
      camposOcultos={[{ nome: "importacaoId", valor: importacao.id }]}
      textoAcaoPrincipal="Continuar para vínculos"
      textoRodape={`${totalColunasDetectadas} colunas detectadas • ${totalMapeadasAutomaticamente} mapeadas automaticamente • ${totalPendentes} pendente${totalPendentes === 1 ? "" : "s"}`}
      estadoVazio="Nenhuma coluna registrada para esta importação."
    />
  );
}

function BarraFiltros({
  importacaoId,
  filtros,
  categorias,
  marcas,
}: {
  importacaoId: string;
  filtros: FiltrosFornecedor;
  categorias: string[];
  marcas: string[];
}) {
  return (
    <form
      action={`/admin/fornecedores/importacoes/${importacaoId}`}
      className="sticky top-0 z-10 grid gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-2 xl:grid-cols-[1.2fr_130px_150px_140px_130px_140px_150px_100px_auto]"
    >
      <input type="hidden" name="etapa" value={filtros.etapa} />
      <input
        name="busca"
        defaultValue={filtros.busca}
        placeholder="Buscar produto"
        className="h-9 rounded-md border border-slate-200 px-3 text-sm"
      />
      <input
        name="codigoFornecedor"
        defaultValue={filtros.codigoFornecedor}
        placeholder="Código"
        className="h-9 rounded-md border border-slate-200 px-3 text-sm"
      />
      <select
        name="categoriaFornecedor"
        defaultValue={filtros.categoriaFornecedor}
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
      >
        <option value="">Categoria</option>
        {categorias.map((categoria) => (
          <option key={categoria} value={categoria}>
            {categoria}
          </option>
        ))}
      </select>
      <select
        name="status"
        defaultValue={filtros.status}
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
      >
        <option value="">Status</option>
        <option value="localizado">Localizado</option>
        <option value="nao_localizado">Não localizado</option>
        <option value="erro">Erro</option>
      </select>
      <select
        name="marcaFornecedor"
        defaultValue={filtros.marcaFornecedor}
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
      >
        <option value="">Marca</option>
        {marcas.map((marca) => (
          <option key={marca} value={marca}>
            {marca}
          </option>
        ))}
      </select>
      <select
        name="vinculo"
        defaultValue={filtros.vinculo}
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
      >
        <option value="">Vínculo</option>
        <option value="vinculado">Vinculado</option>
        <option value="nao_vinculado">Não vinculado</option>
      </select>
      <select
        name="situacaoPreview"
        defaultValue={filtros.situacaoPreview}
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
      >
        <option value="">Situação preview</option>
        <option value="pronto_para_sincronizar">Pronto</option>
        <option value="pendente_vinculacao">Pendente</option>
        <option value="bloqueado">Bloqueado</option>
      </select>
      <select
        name="limite"
        defaultValue={filtros.limite}
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
      >
        <option value="25">25</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </select>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          <Search className="mr-2 h-4 w-4" />
          Filtrar
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link
            href={`/admin/fornecedores/importacoes/${importacaoId}?etapa=${filtros.etapa}`}
          >
            <FilterX className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </form>
  );
}

export function PaginaDetalheImportacaoFornecedorAdmin({
  importacao,
  linhas,
  todasLinhas,
  paginacao,
  filtros,
  produtosParaVinculo,
  previewSincronizacao,
  revisaoImportacao,
  marcasAtivas,
  categoriasLoja,
}: PaginaDetalheImportacaoFornecedorAdminProps) {
  const categorias = Array.from(
    new Set(
      todasLinhas
        .map((linha) => linha.categoriaFornecedor?.trim())
        .filter((categoria): categoria is string => Boolean(categoria)),
    ),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const marcas = Array.from(
    new Set(
      todasLinhas
        .map((linha) => linha.marcaFornecedor?.trim())
        .filter((marca): marca is string => Boolean(marca)),
    ),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const linhasPreview = previewSincronizacao.itens.slice(
    (paginacao.pagina - 1) * paginacao.limite,
    paginacao.pagina * paginacao.limite,
  );
  const linhasPreviewFiltradas = linhasPreview.filter(
    (item) =>
      !filtros.situacaoPreview || item.situacao === filtros.situacaoPreview,
  );
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <Button asChild variant="ghost" size="sm" className="mb-1 px-0">
            <Link href="/admin/fornecedores/importacoes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Importações
            </Link>
          </Button>
          <p className="text-sm text-slate-500">
            Fornecedores &gt; Importações &gt; Importação #
            {importacao.id.slice(0, 8)}
          </p>
        </div>
        <form action={analisarImportacaoFornecedor}>
          <input type="hidden" name="importacaoId" value={importacao.id} />
          <Button type="submit" size="sm" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar vinculação
          </Button>
        </form>
      </div>

      <CabecalhoExecutivo importacao={importacao} />

      <ResumoCompacto
        importacao={importacao}
        previewSincronizacao={previewSincronizacao}
        revisaoImportacao={revisaoImportacao}
      />

      <StepperImportacao etapaAtual={filtros.etapa} />

      <Tabs value={filtros.etapa} className="gap-4">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-sm">
          {etapas.map((etapa) => (
            <TabsTrigger key={etapa.valor} value={etapa.valor} asChild>
              <Link
                href={montarUrl(importacao.id, filtros, {
                  etapa: etapa.valor,
                  pagina: 1,
                })}
                className="px-3 py-2 text-xs font-semibold tracking-wide text-slate-600 transition-colors data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm"
              >
                {etapa.label}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtros.etapa === "mapeamento" ? (
        <AbaMapeamento
          importacao={importacao}
          linhas={todasLinhas}
          categoriasLoja={categoriasLoja}
          marcasAtivas={marcasAtivas}
        />
      ) : filtros.etapa === "revisao" ? (
        <AbaConciliacaoImportacaoFornecedor
          importacaoId={importacao.id}
          fornecedor={importacao.nomeFornecedor}
          linhas={todasLinhas}
        />
      ) : (
        <BarraFiltros
          importacaoId={importacao.id}
          filtros={filtros}
          categorias={categorias}
          marcas={marcas}
        />
      )}

      {filtros.etapa === "preview" ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <RotuloOrigem campo="Nome" origem="arquivo" />
                </TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>
                  <RotuloOrigem campo="Produto" origem="loja" />
                </TableHead>
                <TableHead>
                  <RotuloOrigem campo="Preço" origem="arquivo" />
                </TableHead>
                <TableHead>
                  <RotuloOrigem campo="Preço" origem="loja" />
                </TableHead>
                <TableHead>Ajustado</TableHead>
                <TableHead className="text-right">
                  <RotuloOrigem
                    campo="Estoque"
                    origem="arquivo"
                    alinhar="right"
                  />
                </TableHead>
                <TableHead className="text-right">Diferença</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhasPreviewFiltradas.map((item) => (
                <TableRow key={item.stagingId}>
                  <TableCell className="max-w-[280px] truncate font-medium">
                    {item.nomeProdutoFornecedor}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.situacao}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate">
                    {item.produtoVinculadoNome ?? "-"}
                  </TableCell>
                  <TableCell>{formatarMoeda(item.precoFornecedor)}</TableCell>
                  <TableCell>{formatarMoeda(item.precoAtualLoja)}</TableCell>
                  <TableCell>{formatarMoeda(item.precoCalculado)}</TableCell>
                  <TableCell className="text-right">
                    {item.estoqueFornecedor ?? "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatarMoeda(item.diferencaPreco)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : filtros.etapa === "mapeamento" ||
        filtros.etapa === "revisao" ? null : (
        <AbaVinculacaoImportacaoFornecedor
          importacaoId={importacao.id}
          linhas={linhas}
          paginacao={paginacao}
          filtros={filtros}
          produtosParaVinculo={produtosParaVinculo}
        />
      )}
    </main>
  );
}
