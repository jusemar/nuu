import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  fornecedorProdutosStagingTable,
  importacaoFornecedorAjustesTable,
  importacoesFornecedorTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import type {
  AjustePrecoImportacaoFornecedor,
  ResultadoCalculoAjustePrecoFornecedor,
  ResumoAjustesPrecoFornecedor,
} from "../types/fornecedores.types";
import { resolverAjustePrecoFornecedor } from "./resolver-ajuste-preco.service";

const TAMANHO_LOTE_ATUALIZACAO_PRECOS = 500;

function montarAjustesPorEscopo(ajustes: AjustePrecoImportacaoFornecedor[]) {
  return {
    global: ajustes.find((ajuste) => ajuste.escopoAjuste === "global") ?? null,
    categorias: new Map(
      ajustes
        .filter(
          (ajuste) =>
            ajuste.escopoAjuste === "categoria" &&
            Boolean(ajuste.categoriaFornecedor),
        )
        .map((ajuste) => [ajuste.categoriaFornecedor as string, ajuste]),
    ),
    produtos: new Map(
      ajustes
        .filter(
          (ajuste) =>
            ajuste.escopoAjuste === "produto" &&
            Boolean(ajuste.produtoStagingId),
        )
        .map((ajuste) => [ajuste.produtoStagingId as string, ajuste]),
    ),
  };
}

async function atualizarPrecosCalculados(
  resultados: ResultadoCalculoAjustePrecoFornecedor[],
) {
  for (
    let inicio = 0;
    inicio < resultados.length;
    inicio += TAMANHO_LOTE_ATUALIZACAO_PRECOS
  ) {
    const lote = resultados.slice(
      inicio,
      inicio + TAMANHO_LOTE_ATUALIZACAO_PRECOS,
    );

    await dbTransacional.execute(sql`
      UPDATE fornecedor_produtos_staging
      SET
        preco_original = CASE id ${sql.join(
          lote.map((linha) =>
            linha.precoOriginal
              ? sql`WHEN ${linha.stagingId}::uuid THEN ${linha.precoOriginal}::numeric`
              : sql`WHEN ${linha.stagingId}::uuid THEN NULL`,
          ),
          sql.raw(" "),
        )} END,
        preco_calculado = CASE id ${sql.join(
          lote.map((linha) =>
            linha.precoCalculado
              ? sql`WHEN ${linha.stagingId}::uuid THEN ${linha.precoCalculado}::numeric`
              : sql`WHEN ${linha.stagingId}::uuid THEN NULL`,
          ),
          sql.raw(" "),
        )} END,
        origem_ajuste = CASE id ${sql.join(
          lote.map(
            (linha) =>
              sql`WHEN ${linha.stagingId}::uuid THEN ${linha.origemAjuste}::fornecedor_preco_origem_ajuste`,
          ),
          sql.raw(" "),
        )} END,
        atualizado_em = now()
      WHERE id IN (${sql.join(
        lote.map((linha) => sql`${linha.stagingId}::uuid`),
        sql.raw(", "),
      )})
    `);
  }
}

export async function calcularAjustesImportacaoFornecedor(
  importacaoId: string,
): Promise<ResumoAjustesPrecoFornecedor> {
  const [importacao] = await db
    .select({ id: importacoesFornecedorTable.id })
    .from(importacoesFornecedorTable)
    .where(eq(importacoesFornecedorTable.id, importacaoId))
    .limit(1);

  if (!importacao) {
    throw new Error("Importação de fornecedor não encontrada.");
  }

  const [linhas, ajustesAtivos] = await Promise.all([
    db
      .select({
        id: fornecedorProdutosStagingTable.id,
        categoriaFornecedor: fornecedorProdutosStagingTable.categoriaFornecedor,
        precoFornecedor: fornecedorProdutosStagingTable.precoFornecedor,
        precoOriginal: fornecedorProdutosStagingTable.precoOriginal,
      })
      .from(fornecedorProdutosStagingTable)
      .where(eq(fornecedorProdutosStagingTable.importacaoId, importacaoId)),
    db
      .select({
        id: importacaoFornecedorAjustesTable.id,
        importacaoId: importacaoFornecedorAjustesTable.importacaoId,
        tipoAjuste: importacaoFornecedorAjustesTable.tipoAjuste,
        escopoAjuste: importacaoFornecedorAjustesTable.escopoAjuste,
        valorAjuste: importacaoFornecedorAjustesTable.valorAjuste,
        categoriaFornecedor:
          importacaoFornecedorAjustesTable.categoriaFornecedor,
        produtoStagingId: importacaoFornecedorAjustesTable.produtoStagingId,
        status: importacaoFornecedorAjustesTable.status,
      })
      .from(importacaoFornecedorAjustesTable)
      .where(
        and(
          eq(importacaoFornecedorAjustesTable.importacaoId, importacaoId),
          eq(importacaoFornecedorAjustesTable.status, "ativo"),
        ),
      ),
  ]);

  const ajustesPorEscopo = montarAjustesPorEscopo(ajustesAtivos);
  const resultados = linhas.map((linha) =>
    resolverAjustePrecoFornecedor(linha, ajustesPorEscopo),
  );

  await atualizarPrecosCalculados(resultados);

  return {
    importacaoId,
    totalProcessados: resultados.length,
    totalComAjuste: resultados.filter(
      (resultado) => resultado.origemAjuste !== "nenhum",
    ).length,
    totalSemPreco: resultados.filter((resultado) => !resultado.precoOriginal)
      .length,
  };
}
