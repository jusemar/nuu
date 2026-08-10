import { notFound } from "next/navigation";

import { PaginaDetalheImportacaoFornecedorAdmin } from "@/features/fornecedores/components/admin/pagina-detalhe-importacao-fornecedor-admin";
import { origemDaImportacaoFornecedor } from "@/features/fornecedores/lib/origem-importacao-fornecedor";
import {
  buscarProdutosParaVinculoFornecedor,
  listarImportacoesFornecedoresAdmin,
  listarOpcoesMapeamentoFornecedor,
  listarRascunhosImportacaoFornecedor,
  listarStagingImportacaoFornecedor,
  listarStagingImportacaoFornecedorAdmin,
} from "@/features/fornecedores/queries";
import { contarEstagiosVinculacaoFornecedor } from "@/features/fornecedores/queries/listar-staging-importacao-fornecedor-admin";
import { analisarRevisaoImportacaoFornecedor } from "@/features/fornecedores/services/analise-revisao-importacao.service";

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
    pagina?: string;
    paginaRevisao?: string;
    limite?: string;
    limiteRevisao?: string;
    detalheId?: string;
    vincularStagingId?: string;
    buscaProduto?: string;
  }>;
};

const etapasPermitidas = ["mapeamento", "vinculacao", "revisao"];
// `publicado` é estágio da importação, e não presença de vínculo — por isso
// entra aqui, ao lado de `vinculado`.
const vinculosPermitidos = ["vinculado", "nao_vinculado", "publicado"];
const statusPermitidos = [
  "aguardando_analise",
  "localizado",
  "nao_localizado",
  "erro",
  "rejeitado",
  "aprovado",
  "ignorado",
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

async function listarOpcoesMapeamentoFornecedorComFallback() {
  try {
    return await listarOpcoesMapeamentoFornecedor();
  } catch (erro) {
    console.error(
      "Não foi possível carregar opções reais para o mapeamento da importação.",
      erro,
    );

    return {
      categoriasLoja: [],
      marcasLoja: [],
    };
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
    pagina,
    limite,
    paginaRevisao,
    limiteRevisao,
    detalheId: parametros.detalheId,
    vincularStagingId: parametros.vincularStagingId,
    buscaProduto: parametros.buscaProduto ?? "",
  };

  const [
    contadoresEstagio,
    stagingPaginado,
    todasLinhas,
    produtosParaVinculo,
    revisao,
    opcoesMapeamento,
    rascunhosImportacao,
  ] = await Promise.all([
    contarEstagiosVinculacaoFornecedor(id),
    listarStagingImportacaoFornecedorAdmin({
      importacaoId: id,
      busca: filtros.busca,
      codigoFornecedor: filtros.codigoFornecedor,
      categoriaFornecedor: filtros.categoriaFornecedor,
      marcaFornecedor: filtros.marcaFornecedor,
      status: filtros.status,
      vinculo:
        filtros.vinculo === "vinculado" ||
        filtros.vinculo === "nao_vinculado" ||
        filtros.vinculo === "publicado"
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
    analisarRevisaoImportacaoFornecedor(id),
    listarOpcoesMapeamentoFornecedorComFallback(),
    // A origem sai da importação já carregada acima: evita uma consulta
    // redundante e, com ela, mais um ponto de falha no recarregamento da tela.
    listarRascunhosImportacaoFornecedor(
      id,
      origemDaImportacaoFornecedor(importacao),
    ),
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
      revisaoImportacao={revisao}
      revisaoItens={revisaoFiltrada}
      revisaoTotal={totalRevisao}
      revisaoPagina={paginaRevisaoAjustada}
      revisaoTotalPaginas={totalPaginasRevisao}
      categorias={categoriasRevisao}
      marcas={marcasRevisao}
      categoriaRevisao={filtros.categoriaRevisao}
      marcaRevisao={filtros.marcaRevisao}
      marcasAtivas={opcoesMapeamento.marcasLoja}
      categoriasLoja={opcoesMapeamento.categoriasLoja}
      rascunhosImportacao={rascunhosImportacao}
      contadoresEstagio={contadoresEstagio}
    />
  );
}
