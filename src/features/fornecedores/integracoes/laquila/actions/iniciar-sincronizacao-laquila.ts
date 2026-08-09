"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import {
  fornecedoresTable,
  fornecedorIntegracoesApiTable,
  fornecedorProdutosApiStagingTable,
  importacoesFornecedorTable,
} from "@/db/schema";
import { possuiSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";

import { METODOS_LAQUILA, PROVEDOR_INTEGRACAO_LAQUILA } from "../constants";
import { normalizarProdutosLaquila } from "../lib/normalizar-produto-laquila";
import { registrarLogIntegracaoFornecedorApi } from "../lib/registrar-log-integracao-fornecedor-api";
import { listarProdutosRecebidosApiLaquila } from "../queries/listar-produtos-recebidos-api-laquila";

type ResultadoIniciarSincronizacaoLaquila = {
  sucesso: boolean;
  mensagem?: string;
  erro?: string;
  importacaoId?: string;
  totalRecebido?: number;
  totalSalvo?: number;
};

/** Quantas linhas vão por INSERT. Evita estourar o limite de parâmetros do driver. */
const TAMANHO_LOTE_STAGING_API = 200;

async function buscarIntegracaoLaquilaAtual() {
  const [integracao] = await db
    .select({
      id: fornecedorIntegracoesApiTable.id,
      fornecedorId: fornecedorIntegracoesApiTable.fornecedorId,
      nomeFornecedor: fornecedoresTable.nome,
    })
    .from(fornecedorIntegracoesApiTable)
    .innerJoin(
      fornecedoresTable,
      eq(fornecedorIntegracoesApiTable.fornecedorId, fornecedoresTable.id),
    )
    .where(
      eq(fornecedorIntegracoesApiTable.provedor, PROVEDOR_INTEGRACAO_LAQUILA),
    )
    .limit(1);

  return integracao ?? null;
}

/**
 * Inicia uma NOVA execução da integração Laquila.
 *
 * Este é o único ponto do fluxo por API que fala com a Laquila. Ele faz, nesta
 * ordem:
 *
 * 1. cria uma linha em `importacoes_fornecedor` (`tipo_arquivo = "api"`) — é
 *    ela que dá identidade ao ciclo, exatamente como o upload faz no fluxo de
 *    arquivo;
 * 2. consulta a API ignorando o cache, porque "nova sincronização" significa
 *    dado novo por definição;
 * 3. grava tudo o que voltou em `fornecedor_produtos_api_staging` **com o
 *    `importacaoId` desta execução**.
 *
 * Depois disso nenhuma tela chama a API de novo: reabrir a importação lê o
 * staging persistido. Uma execução nunca sobrescreve o staging de outra — o
 * mesmo `codigoFornecedor` pode existir em várias, cada uma com o retrato que
 * a API devolveu naquele momento.
 */
export async function iniciarSincronizacaoLaquila(): Promise<ResultadoIniciarSincronizacaoLaquila> {
  if (!(await possuiSessaoFornecedoresAdmin())) {
    return {
      sucesso: false,
      erro: "Sua sessão não está ativa. Entre novamente para sincronizar.",
    };
  }

  const integracao = await buscarIntegracaoLaquilaAtual();

  if (!integracao) {
    return {
      sucesso: false,
      erro: "Configuração Laquila não encontrada. Configure a integração antes de sincronizar.",
    };
  }

  const agora = new Date();
  const [importacao] = await db
    .insert(importacoesFornecedorTable)
    .values({
      fornecedorId: integracao.fornecedorId,
      tipoArquivo: "api",
      status: "em_staging",
      // Arquivo tem nome de arquivo; API não. O campo fica nulo e a tela mostra
      // o provedor no lugar — ver `listarImportacoesRecentesFornecedoresAdmin`.
      nomeArquivo: null,
      configuracaoFluxoJson: {
        origem: "api",
        provedor: PROVEDOR_INTEGRACAO_LAQUILA,
        integracaoApiId: integracao.id,
        iniciadaEm: agora.toISOString(),
      },
      criadoEm: agora,
      atualizadoEm: agora,
    })
    .returning({ id: importacoesFornecedorTable.id });

  if (!importacao) {
    return {
      sucesso: false,
      erro: "Não foi possível registrar a importação da sincronização.",
    };
  }

  try {
    const resultado = await listarProdutosRecebidosApiLaquila({
      ignorarCache: true,
    });

    if (resultado.erro && resultado.produtos.length === 0) {
      await db
        .update(importacoesFornecedorTable)
        .set({ status: "erro", totalErros: 1, atualizadoEm: new Date() })
        .where(eq(importacoesFornecedorTable.id, importacao.id));

      return {
        sucesso: false,
        erro: resultado.erro,
        importacaoId: importacao.id,
        totalRecebido: 0,
        totalSalvo: 0,
      };
    }

    // `dadosBrutosJson` já vem com preço e estoque enriquecidos pela consulta de
    // saldo, então normalizar a partir dele preserva o retrato completo.
    const normalizados = normalizarProdutosLaquila(
      resultado.produtos.map((produto) => produto.dadosBrutosJson),
    );
    // Uma execução não pode conter o mesmo código duas vezes: o índice único é
    // (integração, importação, código).
    const unicosPorCodigo = new Map(
      normalizados.map((produto) => [produto.codigoFornecedor, produto]),
    );
    const linhas = Array.from(unicosPorCodigo.values()).map((produto) => ({
      integracaoApiId: integracao.id,
      importacaoId: importacao.id,
      codigoFornecedor: produto.codigoFornecedor,
      nomeProduto: produto.nomeProduto,
      ean: produto.ean,
      ncm: produto.ncm,
      marcaFornecedor: produto.marcaFornecedor,
      grupoFornecedor: produto.grupoFornecedor,
      subgrupoFornecedor: produto.subgrupoFornecedor,
      precoFornecedor: produto.precoFornecedor,
      estoqueFornecedor: produto.estoqueFornecedor,
      imagemUrl: produto.imagemUrl,
      unidade: produto.unidade,
      pesoBruto: produto.pesoBruto,
      pesoLiquido: produto.pesoLiquido,
      largura: produto.largura,
      altura: produto.altura,
      comprimento: produto.comprimento,
      dadosBrutosJson: produto.dadosBrutosJson,
      status: "novo" as const,
      ultimaConsultaEm: agora,
      criadoEm: agora,
      atualizadoEm: agora,
    }));

    for (let inicio = 0; inicio < linhas.length; inicio += TAMANHO_LOTE_STAGING_API) {
      await db
        .insert(fornecedorProdutosApiStagingTable)
        .values(linhas.slice(inicio, inicio + TAMANHO_LOTE_STAGING_API));
    }

    await db
      .update(importacoesFornecedorTable)
      .set({
        status: linhas.length > 0 ? "em_staging" : "pendente",
        totalLinhas: linhas.length,
        totalProcessadas: linhas.length,
        totalErros: 0,
        atualizadoEm: new Date(),
      })
      .where(eq(importacoesFornecedorTable.id, importacao.id));

    await registrarLogIntegracaoFornecedorApi({
      integracaoApiId: integracao.id,
      metodo: METODOS_LAQUILA.consultarItem,
      operacao: "iniciar_sincronizacao_laquila",
      status: "sucesso",
      mensagem: "Nova sincronização Laquila registrada como importação.",
      responseResumo: {
        importacaoId: importacao.id,
        totalRetornadoApi: resultado.totalRetornadoApi,
        totalAposRecorte: resultado.totalAposRecorte,
        totalSalvoStaging: linhas.length,
      },
    }).catch(() => undefined);

    revalidatePath("/admin/fornecedores/importacoes");
    revalidatePath("/admin/fornecedores/integracoes/laquila");

    return {
      sucesso: true,
      mensagem: `Sincronização concluída: ${linhas.length} produto${linhas.length === 1 ? "" : "s"} recebido${linhas.length === 1 ? "" : "s"}.`,
      importacaoId: importacao.id,
      totalRecebido: resultado.totalAposRecorte,
      totalSalvo: linhas.length,
    };
  } catch (erro) {
    console.error("[iniciarSincronizacaoLaquila]", {
      importacaoId: importacao.id,
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
    });

    await db
      .update(importacoesFornecedorTable)
      .set({ status: "erro", totalErros: 1, atualizadoEm: new Date() })
      .where(eq(importacoesFornecedorTable.id, importacao.id))
      .catch(() => undefined);

    return {
      sucesso: false,
      erro: "Não foi possível concluir a sincronização com a Laquila.",
      importacaoId: importacao.id,
    };
  }
}
