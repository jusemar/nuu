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
  type FiltroConciliacaoFornecedor,
  FILTROS_CONCILIACAO_FORNECEDOR,
} from "@/features/fornecedores/queries/listar-rascunhos-importacao-fornecedor";
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
    paginaConciliacao?: string;
    limiteConciliacao?: string;
    buscaConciliacao?: string;
    filtroConciliacao?: string;
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
  const filtroConciliacao = FILTROS_CONCILIACAO_FORNECEDOR.includes(
    parametros.filtroConciliacao as FiltroConciliacaoFornecedor,
  )
    ? (parametros.filtroConciliacao as FiltroConciliacaoFornecedor)
    : "todos";

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
    buscaConciliacao: parametros.buscaConciliacao ?? "",
    filtroConciliacao,
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
    etapa === "vinculacao"
      ? contarEstagiosVinculacaoFornecedor(id)
      : Promise.resolve({
          todos: 0,
          conciliacao: 0,
          vinculados: 0,
          pendentes: 0,
          novos: 0,
          ignorados: 0,
          publicados: 0,
          erros: 0,
        }),
    etapa === "vinculacao"
      ? listarStagingImportacaoFornecedorAdmin({
          importacaoId: id,
          busca: filtros.busca,
          codigoFornecedor: filtros.codigoFornecedor,
          categoriaFornecedor: filtros.categoriaFornecedor,
          marcaFornecedor: filtros.marcaFornecedor,
          status: filtros.status,
          estagio: (filtros.estagio || undefined) as
            | EstagioVinculacaoFornecedor
            | undefined,
          pagina,
          limite,
        })
      : Promise.resolve({
          linhas: [],
          paginacao: {
            pagina: 1,
            limite,
            total: 0,
            totalPaginas: 1,
            offset: 0,
          },
        }),
    precisaDasLinhasCompletas
      ? listarStagingImportacaoFornecedor(id)
      : Promise.resolve([]),
    etapa === "vinculacao" && filtros.vincularStagingId
      ? buscarProdutosParaVinculoFornecedor({
          busca: filtros.buscaProduto,
        })
      : [],
    resumirRevisaoImportacaoFornecedor(id),
    etapa === "vinculacao"
      ? listarValoresDistintosStagingFornecedor(id)
      : Promise.resolve({ categorias: [], marcas: [] }),
    listarOpcoesMapeamentoFornecedorComFallback(),
    // A origem sai da importação já carregada acima: evita uma consulta
    // redundante e, com ela, mais um ponto de falha no recarregamento da tela.
    etapa === "revisao"
      ? listarRascunhosImportacaoFornecedor(
          id,
          origemDaImportacaoFornecedor(importacao),
          {
            pagina: parametros.paginaConciliacao,
            limite: parametros.limiteConciliacao,
            busca: parametros.buscaConciliacao,
            filtro: filtroConciliacao,
          },
        )
      : Promise.resolve({
          itens: [],
          paginacao: {
            pagina: 1,
            limite: normalizarLimiteFornecedores(parametros.limiteConciliacao),
            total: 0,
            totalPaginas: 1,
            offset: 0,
          },
          resumo: {
            todos: 0,
            novos: 0,
            vinculados: 0,
            pendencias: 0,
            alertas: 0,
            prontos: 0,
          },
        }),
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
      rascunhosImportacao={rascunhosImportacao.itens}
      paginacaoConciliacao={rascunhosImportacao.paginacao}
      resumoConciliacao={rascunhosImportacao.resumo}
      filtroConciliacao={filtroConciliacao}
      buscaConciliacao={parametros.buscaConciliacao ?? ""}
      contadoresEstagio={contadoresEstagio}
    />
  );
}
