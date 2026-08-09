import {
  ArrowLeft,
  FilterX,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  analisarImportacaoFornecedor,
  aplicarMapeamentoColunasFornecedorAction,
} from "../../actions";
import type { RascunhoImportacaoFornecedor } from "../../queries/listar-rascunhos-importacao-fornecedor";
import type {
  CampoMapeamentoColunaFornecedor,
  ColunaPlanilhaFornecedor,
  ProdutoParaVinculoFornecedor,
  ResultadoRevisaoImportacaoFornecedor,
} from "../../types/fornecedores.types";
import { AbaConciliacaoImportacaoFornecedor } from "./aba-conciliacao-importacao-fornecedor";
import { AbaVinculacaoImportacaoFornecedor } from "./aba-vinculacao-importacao-fornecedor";
import { BotaoSubmitComEstado } from "./botao-submit-com-estado";
import { PassosFluxoFornecedor } from "./compartilhados/passos-fluxo-fornecedor";
import {
  type DadosTemporariosMapeamentoFornecedor,
  type OpcaoValorPadraoLoja,
  TabelaMapeamentoCamposFornecedor,
} from "./tabela-mapeamento-campos-fornecedor";

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
  configuracaoFluxoJson: Record<string, unknown>;
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
  rascunhosImportacao: RascunhoImportacaoFornecedor[];
};

const etapas = [
  { valor: "mapeamento", label: "Mapeamento" },
  { valor: "vinculacao", label: "Vinculação" },
  { valor: "revisao", label: "Conciliação" },
] as const;

const camposMapeamento = [
  ["codigo_fornecedor", "Código fornecedor"],
  ["nome_produto", "Nome do produto"],
  ["categoria_fornecedor", "Categoria da loja"],
  ["marca_fornecedor", "Marca da loja"],
  ["preco_fornecedor", "Preço fornecedor"],
  ["estoque_fornecedor", "Estoque fornecedor"],
] satisfies Array<[CampoMapeamentoColunaFornecedor, string]>;

function formatarData(valor: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(valor);
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
  revisaoImportacao,
}: {
  importacao: ImportacaoFornecedorAdmin;
  revisaoImportacao: ResultadoRevisaoImportacaoFornecedor;
}) {
  const cards = [
    ["Total importado", importacao.totalLinhas],
    ["Processados", importacao.totalProcessadas],
    ["Erros", importacao.totalErros],
    ["Produtos OK", revisaoImportacao.resumo.totalProdutosOK],
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
      <div className="grid gap-1.5 sm:grid-cols-2 md:grid-cols-4">
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
      nomeCampoConfiguracaoFluxo="configuracaoFluxoJson"
      configuracaoInicial={
        Array.isArray(importacao.configuracaoFluxoJson.regras) &&
        importacao.configuracaoFluxoJson.destinosSelecionados &&
        typeof importacao.configuracaoFluxoJson.destinosSelecionados ===
          "object"
          ? (importacao.configuracaoFluxoJson as DadosTemporariosMapeamentoFornecedor)
          : null
      }
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
      className="sticky top-0 z-10 grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6"
    >
      <input type="hidden" name="etapa" value={filtros.etapa} />
      <input
        name="busca"
        defaultValue={filtros.busca}
        placeholder="Buscar produto"
        className="h-9 min-w-0 rounded-md border border-slate-200 px-3 text-sm sm:col-span-2"
      />
      <input
        name="codigoFornecedor"
        defaultValue={filtros.codigoFornecedor}
        placeholder="Código"
        className="h-9 min-w-0 rounded-md border border-slate-200 px-3 text-sm"
      />
      <select
        name="categoriaFornecedor"
        defaultValue={filtros.categoriaFornecedor}
        className="h-9 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm"
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
        className="h-9 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm"
      >
        <option value="">Status</option>
        <option value="localizado">Localizado</option>
        <option value="nao_localizado">Não localizado</option>
        <option value="erro">Erro</option>
      </select>
      <select
        name="marcaFornecedor"
        defaultValue={filtros.marcaFornecedor}
        className="h-9 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm"
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
        className="h-9 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm"
      >
        <option value="">Vínculo</option>
        <option value="vinculado">Vinculado</option>
        <option value="nao_vinculado">Não vinculado</option>
      </select>
      <select
        name="limite"
        defaultValue={filtros.limite}
        className="h-9 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm"
      >
        <option value="25">25</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </select>
      <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1">
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
  revisaoImportacao,
  marcasAtivas,
  categoriasLoja,
  rascunhosImportacao,
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
  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 p-4 md:p-6">
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
          {/* Relocaliza todos os produtos da importação; em planilhas grandes leva alguns
              segundos. Sem estado de processamento, o usuário clicava várias vezes e
              disparava a mesma análise em paralelo. */}
          <BotaoSubmitComEstado
            size="sm"
            variant="outline"
            textoProcessando="Localizando produtos…"
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Atualizar vinculação
          </BotaoSubmitComEstado>
        </form>
      </div>

      <CabecalhoExecutivo importacao={importacao} />

      <ResumoCompacto
        importacao={importacao}
        revisaoImportacao={revisaoImportacao}
      />

      <PassosFluxoFornecedor
        passoAtual={
          filtros.etapa === "vinculacao"
            ? "Vinculação"
            : filtros.etapa === "revisao"
              ? "Conciliação"
              : "Mapeamento"
        }
        origem={{ tipo: "arquivo" }}
        rotuloAquisicao="Selecionar arquivo"
        fornecedor={importacao.nomeFornecedor}
      />

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
          rascunhos={rascunhosImportacao}
          categoriasLoja={categoriasLoja}
          marcasLoja={marcasAtivas}
        />
      ) : (
        <BarraFiltros
          importacaoId={importacao.id}
          filtros={filtros}
          categorias={categorias}
          marcas={marcas}
        />
      )}

      {filtros.etapa === "mapeamento" || filtros.etapa === "revisao" ? null : (
        <AbaVinculacaoImportacaoFornecedor
          importacaoId={importacao.id}
          linhas={linhas}
          paginacao={paginacao}
          filtros={filtros}
          produtosParaVinculo={produtosParaVinculo}
          configuracaoFluxoJson={importacao.configuracaoFluxoJson}
          rascunhos={rascunhosImportacao}
        />
      )}
    </main>
  );
}
