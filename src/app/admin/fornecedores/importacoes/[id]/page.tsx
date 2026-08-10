import { notFound } from "next/navigation";

import { PaginaDetalheImportacaoFornecedorAdmin } from "@/features/fornecedores/components/admin/pagina-detalhe-importacao-fornecedor-admin";
import { origemDaImportacaoFornecedor } from "@/features/fornecedores/lib/origem-importacao-fornecedor";
import {
  normalizarLimiteFornecedores,
  normalizarPaginaFornecedores,
} from "@/features/fornecedores/lib/paginacao-fornecedores";
import {
  buscarProdutosParaVinculoFornecedor,
  listarImportacoesFornecedoresAdmin,
  listarOpcoesMapeamentoFornecedor,
  listarRascunhosImportacaoFornecedor,
  listarStagingImportacaoFornecedor,
  listarStagingImportacaoFornecedorAdmin,
} from "@/features/fornecedores/queries";
import {
  contarEstagiosVinculacaoFornecedor,
  type EstagioVinculacaoFornecedor,
} from "@/features/fornecedores/queries/listar-staging-importacao-fornecedor-admin";
import {
  listarValoresDistintosStagingFornecedor,
  resumirRevisaoImportacaoFornecedor,
} from "@/features/fornecedores/queries/resumir-revisao-importacao-fornecedor";


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
    estagio?: string;
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
/** Os seis estágios que um item pode ter dentro de uma importação. */
const estagiosPermitidos = [
  "publicado",
  "vinculado",
  "novo",
  "pendente",
  "ignorado",
  "erro",
] as const;
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
  const limite = normalizarLimiteFornecedores(parametros.limite);
  const pagina = normalizarPaginaFornecedores(parametros.pagina);
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
    estagio: (estagiosPermitidos as readonly string[]).includes(
      parametros.estagio ?? "",
    )
      ? (parametros.estagio as string)
      : "",
    pagina,
    limite,
    paginaRevisao,
    limiteRevisao,
    detalheId: parametros.detalheId,
    vincularStagingId: parametros.vincularStagingId,
    buscaProduto: parametros.buscaProduto ?? "",
  };

  // `todasLinhas` (685 linhas com jsonb) só é carregada no Mapeamento, a única
  // etapa que realmente precisa de todas. Vinculação e Conciliação usam a
  // página paginada e os agregados.
  const precisaDasLinhasCompletas = etapa === "mapeamento";

  const [
    contadoresEstagio,
    stagingPaginado,
    todasLinhas,
    produtosParaVinculo,
    resumoRevisao,
    valoresDistintos,
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
      estagio: (filtros.estagio ||
        undefined) as EstagioVinculacaoFornecedor | undefined,
      pagina,
      limite,
    }),
    precisaDasLinhasCompletas
      ? listarStagingImportacaoFornecedor(id)
      : Promise.resolve([]),
    filtros.vincularStagingId
      ? buscarProdutosParaVinculoFornecedor({
          busca: filtros.buscaProduto,
        })
      : [],
    resumirRevisaoImportacaoFornecedor(id),
    listarValoresDistintosStagingFornecedor(id),
    listarOpcoesMapeamentoFornecedorComFallback(),
    // A origem sai da importação já carregada acima: evita uma consulta
    // redundante e, com ela, mais um ponto de falha no recarregamento da tela.
    listarRascunhosImportacaoFornecedor(
      id,
      origemDaImportacaoFornecedor(importacao),
    ),
  ]);

  return (
    <PaginaDetalheImportacaoFornecedorAdmin
      importacao={importacao}
      linhas={stagingPaginado.linhas}
      todasLinhas={todasLinhas}
      paginacao={stagingPaginado.paginacao}
      resumoRevisao={resumoRevisao}
      categorias={valoresDistintos.categorias}
      marcas={valoresDistintos.marcas}
      filtros={filtros}
      produtosParaVinculo={produtosParaVinculo}
      marcasAtivas={opcoesMapeamento.marcasLoja}
      categoriasLoja={opcoesMapeamento.categoriasLoja}
      rascunhosImportacao={rascunhosImportacao}
      contadoresEstagio={contadoresEstagio}
    />
  );
}
