import { notFound } from "next/navigation";

import { PaginaDetalheImportacaoFornecedorAdmin } from "@/features/fornecedores/components/admin/pagina-detalhe-importacao-fornecedor-admin";
import {
  buscarProdutosParaVinculoFornecedor,
  listarImportacoesFornecedoresAdmin,
  listarStagingImportacaoFornecedor,
  listarStagingImportacaoFornecedorAdmin,
} from "@/features/fornecedores/queries";
import { listarMarcasAtivas } from "@/features/admin/marcas/services/marcaService";
import { analisarRevisaoImportacaoFornecedor } from "@/features/fornecedores/services/analise-revisao-importacao.service";
import { gerarPreviewSincronizacaoFornecedor } from "@/features/fornecedores/services/gerar-preview-sincronizacao.service";

type ImportacaoFornecedorDetalhePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    etapa?: string;
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
    pagina?: string;
    paginaRevisao?: string;
    limite?: string;
    limiteRevisao?: string;
    detalheId?: string;
    vincularStagingId?: string;
    buscaProduto?: string;
  }>;
};

const etapasPermitidas = [
  "mapeamento",
  "vinculacao",
  "revisao",
  "preview",
];
const vinculosPermitidos = ["vinculado", "nao_vinculado"];
const statusPermitidos = [
  "aguardando_analise",
  "localizado",
  "nao_localizado",
  "erro",
  "rejeitado",
  "aprovado",
] as const;

type StatusPermitido = (typeof statusPermitidos)[number];

function numeroParametro(valor: string | undefined, padrao: number) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : padrao;
}

function normalizarStatus(
  valor: string | undefined,
): StatusPermitido | undefined {
  return statusPermitidos.includes(valor as StatusPermitido)
    ? (valor as StatusPermitido)
    : undefined;
}

function normalizarTexto(valor: string | null | undefined) {
  return (valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

async function listarMarcasAtivasComFallback() {
  try {
    return await listarMarcasAtivas();
  } catch (erro) {
    console.error(
      "Não foi possível carregar marcas ativas para revisão da importação.",
      erro,
    );

    return [];
  }
}

export default async function Page({
  params,
  searchParams,
}: ImportacaoFornecedorDetalhePageProps) {
  const { id } = await params;
  const parametros = await searchParams;
  const etapa = etapasPermitidas.includes(parametros.etapa ?? "")
    ? (parametros.etapa as string)
    : "mapeamento";
  const limite = numeroParametro(parametros.limite, 25);
  const pagina = numeroParametro(parametros.pagina, 1);
  const limiteRevisao = numeroParametro(parametros.limiteRevisao, 10);
  const paginaRevisao = numeroParametro(parametros.paginaRevisao, 1);

  const importacoes = await listarImportacoesFornecedoresAdmin();
  const importacao = importacoes.find((item) => item.id === id);

  if (!importacao) {
    notFound();
  }

  const filtros = {
    etapa,
    busca: parametros.busca ?? "",
    buscaRevisao: parametros.buscaRevisao ?? "",
    categoriaRevisao: parametros.categoriaRevisao ?? "",
    marcaRevisao: parametros.marcaRevisao ?? "",
    codigoFornecedor: parametros.codigoFornecedor ?? "",
    categoriaFornecedor: parametros.categoriaFornecedor ?? "",
    marcaFornecedor: parametros.marcaFornecedor ?? "",
    status: normalizarStatus(parametros.status),
    vinculo: vinculosPermitidos.includes(parametros.vinculo ?? "")
      ? parametros.vinculo
      : "",
    situacaoPreview: parametros.situacaoPreview ?? "",
    pagina,
    limite,
    paginaRevisao,
    limiteRevisao,
    detalheId: parametros.detalheId,
    vincularStagingId: parametros.vincularStagingId,
    buscaProduto: parametros.buscaProduto ?? "",
  };

  const [
    stagingPaginado,
    todasLinhas,
    produtosParaVinculo,
    preview,
    revisao,
    marcasAtivas,
  ] = await Promise.all([
    listarStagingImportacaoFornecedorAdmin({
      importacaoId: id,
      busca: filtros.busca,
      codigoFornecedor: filtros.codigoFornecedor,
      categoriaFornecedor: filtros.categoriaFornecedor,
      marcaFornecedor: filtros.marcaFornecedor,
      status: filtros.status,
      vinculo:
        filtros.vinculo === "vinculado" || filtros.vinculo === "nao_vinculado"
          ? filtros.vinculo
          : undefined,
      pagina,
      limite,
    }),
    listarStagingImportacaoFornecedor(id),
    filtros.vincularStagingId
      ? buscarProdutosParaVinculoFornecedor({
          busca: filtros.buscaProduto,
        })
      : [],
    gerarPreviewSincronizacaoFornecedor({ importacaoId: id }),
    analisarRevisaoImportacaoFornecedor(id),
    listarMarcasAtivasComFallback(),
  ]);

  const termoCategoriaRevisao = normalizarTexto(filtros.categoriaRevisao);
  const termoMarcaRevisao = normalizarTexto(filtros.marcaRevisao);
  const revisaoFiltrada = revisao.itens.filter((item) => {
    const categoria = normalizarTexto(item.categoriaFornecedor);
    const marca = normalizarTexto(item.marcaFornecedor);

    if (termoCategoriaRevisao && categoria !== termoCategoriaRevisao) {
      return false;
    }

    if (termoMarcaRevisao && marca !== termoMarcaRevisao) {
      return false;
    }

    return true;
  });

  const categoriasRevisao = Array.from(
    new Set(
      todasLinhas
        .map((item) => item.categoriaFornecedor?.trim())
        .filter((valor): valor is string => Boolean(valor)),
    ),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const marcasRevisao = Array.from(
    new Set(
      todasLinhas
        .map((item) => item.marcaFornecedor?.trim())
        .filter((valor): valor is string => Boolean(valor)),
    ),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const totalRevisao = revisaoFiltrada.length;
  const totalPaginasRevisao = Math.max(
    1,
    Math.ceil(totalRevisao / filtros.limiteRevisao),
  );
  const paginaRevisaoAjustada = Math.min(
    filtros.paginaRevisao,
    totalPaginasRevisao,
  );
  return (
    <PaginaDetalheImportacaoFornecedorAdmin
      importacao={importacao}
      linhas={stagingPaginado.linhas}
      todasLinhas={todasLinhas}
      paginacao={stagingPaginado.paginacao}
      filtros={filtros}
      produtosParaVinculo={produtosParaVinculo}
      previewSincronizacao={preview}
      revisaoImportacao={revisao}
      revisaoItens={revisaoFiltrada}
      revisaoTotal={totalRevisao}
      revisaoPagina={paginaRevisaoAjustada}
      revisaoTotalPaginas={totalPaginasRevisao}
      categorias={categoriasRevisao}
      marcas={marcasRevisao}
      categoriaRevisao={filtros.categoriaRevisao}
      marcaRevisao={filtros.marcaRevisao}
      marcasAtivas={marcasAtivas}
    />
  );
}
