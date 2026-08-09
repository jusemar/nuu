import "server-only";

import { inArray, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  fornecedorProdutosApiStagingTable,
  fornecedorProdutosStagingTable,
  produtoRascunhosTable,
} from "@/db/schema";
import {
  CONTADORES_IMPORTACAO_ZERADOS,
  type ContadoresImportacaoFornecedor,
} from "@/features/fornecedores/lib/estado-importacao-fornecedor";

function chaveImportacaoDoRascunho() {
  return sql<string>`${produtoRascunhosTable.dadosOrigemJson}->'origemFluxoFornecedor'->>'importacaoId'`;
}

/**
 * Contadores de CADA importação, sem misturar execuções.
 *
 * O staging responde "quanto entrou" e os rascunhos respondem "o que o gestor
 * decidiu" — as duas leituras já são escopadas por `importacaoId`, nas duas
 * origens. Linhas legadas de staging da API (sem `importacaoId`) não entram em
 * nenhum total porque não pertencem a execução nenhuma.
 */
export async function contarItensImportacoesFornecedor(
  importacaoIds: string[],
): Promise<Map<string, ContadoresImportacaoFornecedor>> {
  const contadores = new Map<string, ContadoresImportacaoFornecedor>();

  if (importacaoIds.length === 0) return contadores;

  for (const id of importacaoIds) {
    contadores.set(id, { ...CONTADORES_IMPORTACAO_ZERADOS });
  }

  function acumular(
    importacaoId: string | null,
    campo: keyof ContadoresImportacaoFornecedor,
    quantidade: number,
  ) {
    if (!importacaoId) return;

    const atual = contadores.get(importacaoId);
    if (!atual) return;

    atual[campo] += quantidade;
  }

  const [stagingArquivo, stagingApi, rascunhos] = await Promise.all([
    db
      .select({
        importacaoId: fornecedorProdutosStagingTable.importacaoId,
        status: fornecedorProdutosStagingTable.status,
        total: sql<number>`count(*)`,
      })
      .from(fornecedorProdutosStagingTable)
      .where(inArray(fornecedorProdutosStagingTable.importacaoId, importacaoIds))
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
        importacaoId: chaveImportacaoDoRascunho(),
        status: produtoRascunhosTable.status,
        total: sql<number>`count(*)`,
      })
      .from(produtoRascunhosTable)
      .where(sql`${chaveImportacaoDoRascunho()} = ANY(${importacaoIds})`)
      .groupBy(chaveImportacaoDoRascunho(), produtoRascunhosTable.status),
  ]);

  for (const linha of [...stagingArquivo, ...stagingApi]) {
    const quantidade = Number(linha.total);

    acumular(linha.importacaoId, "total", quantidade);

    if (linha.status === "ignorado") {
      acumular(linha.importacaoId, "ignorados", quantidade);
    }

    if (linha.status === "erro") {
      acumular(linha.importacaoId, "erros", quantidade);
    }
  }

  for (const linha of rascunhos) {
    if (linha.status !== "publicado") continue;

    acumular(linha.importacaoId, "publicados", Number(linha.total));
  }

  // Pendente é o resto: entrou na execução e ainda não foi resolvido de
  // nenhuma forma. Calcular por diferença evita contar duas vezes o mesmo item
  // (ele existe como linha de staging E como rascunho) e cobre igualmente as
  // duas origens, que têm enums de staging diferentes.
  for (const contador of contadores.values()) {
    contador.pendentes = Math.max(
      0,
      contador.total -
        contador.publicados -
        contador.ignorados -
        contador.erros,
    );
  }

  return contadores;
}
