import "server-only";

import { inArray, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  fornecedorProdutosApiStagingTable,
  fornecedorProdutosStagingTable,
  produtoRascunhosTable,
} from "@/db/schema";
import {
  agregarContadoresImportacoesFornecedor,
  type ContadoresImportacaoFornecedor,
} from "@/features/fornecedores/lib/estado-importacao-fornecedor";
import {
  chaveImportacaoRascunhoFornecedor,
  filtrarRascunhosPorImportacoesFornecedor,
} from "@/features/fornecedores/lib/filtro-importacoes-rascunhos-fornecedor";
import { executarLeituraFornecedores } from "@/features/fornecedores/lib/leitura-segura-fornecedores";

/**
 * Contadores de CADA importação, sem misturar execuções.
 *
 * O staging responde "quanto entrou" e os rascunhos respondem "o que o gestor
 * decidiu" — as duas leituras são escopadas por `importacaoId`, nas duas
 * origens. Linhas legadas de staging da API (sem `importacaoId`) não entram em
 * nenhum total porque não pertencem a execução nenhuma.
 *
 * Aqui fica só a LEITURA; a contagem em si vive em
 * `lib/estado-importacao-fornecedor`, onde é testada sem banco.
 */
export async function contarItensImportacoesFornecedor(
  importacaoIds: string[],
): Promise<Map<string, ContadoresImportacaoFornecedor>> {
  if (importacaoIds.length === 0) {
    return new Map<string, ContadoresImportacaoFornecedor>();
  }

  // As tres leituras vao juntas na MESMA leitura protegida: uma oscilacao de
  // conexao aqui derrubaria a lista de importacoes inteira, e os tres conjuntos
  // precisam concordar entre si para os contadores fecharem.
  const [stagingArquivo, stagingApi, rascunhos] = await executarLeituraFornecedores(
    {
      etapa: "importacoes:contar-itens",
      mensagemAmigavel:
        "Não foi possível calcular os contadores das importações agora. Tente novamente em alguns segundos.",
    },
    () =>
      Promise.all([
    db
      .select({
        importacaoId: fornecedorProdutosStagingTable.importacaoId,
        status: fornecedorProdutosStagingTable.status,
        total: sql<number>`count(*)`,
      })
      .from(fornecedorProdutosStagingTable)
      .where(
        inArray(fornecedorProdutosStagingTable.importacaoId, importacaoIds),
      )
      .groupBy(
        fornecedorProdutosStagingTable.importacaoId,
        fornecedorProdutosStagingTable.status,
      ),
    db
      .select({
        importacaoId: fornecedorProdutosApiStagingTable.importacaoId,
        status: fornecedorProdutosApiStagingTable.status,
        total: sql<number>`count(*)`,
      })
      .from(fornecedorProdutosApiStagingTable)
      .where(
        inArray(fornecedorProdutosApiStagingTable.importacaoId, importacaoIds),
      )
      .groupBy(
        fornecedorProdutosApiStagingTable.importacaoId,
        fornecedorProdutosApiStagingTable.status,
      ),
    db
      .select({
        importacaoId: chaveImportacaoRascunhoFornecedor(),
        status: produtoRascunhosTable.status,
        total: sql<number>`count(*)`,
      })
      .from(produtoRascunhosTable)
      .where(filtrarRascunhosPorImportacoesFornecedor(importacaoIds))
      .groupBy(
        chaveImportacaoRascunhoFornecedor(),
        produtoRascunhosTable.status,
      ),
      ]),
  );

  return agregarContadoresImportacoesFornecedor({
    importacaoIds,
    linhasStaging: [...stagingArquivo, ...stagingApi],
    linhasRascunho: rascunhos,
  });
}
