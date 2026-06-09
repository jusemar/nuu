import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedorProdutosStagingTable, productTable } from "@/db/schema";

export async function listarStagingImportacaoFornecedor(importacaoId: string) {
  return db
    .select({
      id: fornecedorProdutosStagingTable.id,
      importacaoId: fornecedorProdutosStagingTable.importacaoId,
      codigoFornecedor: fornecedorProdutosStagingTable.codigoFornecedor,
      nomeProduto: fornecedorProdutosStagingTable.nomeProduto,
      categoriaFornecedor: fornecedorProdutosStagingTable.categoriaFornecedor,
      precoFornecedor: fornecedorProdutosStagingTable.precoFornecedor,
      precoOriginal: fornecedorProdutosStagingTable.precoOriginal,
      precoCalculado: fornecedorProdutosStagingTable.precoCalculado,
      origemAjuste: fornecedorProdutosStagingTable.origemAjuste,
      estoqueFornecedor: fornecedorProdutosStagingTable.estoqueFornecedor,
      produtoLocalizadoId: fornecedorProdutosStagingTable.produtoLocalizadoId,
      criterioLocalizacao: fornecedorProdutosStagingTable.criterioLocalizacao,
      errosValidacao: fornecedorProdutosStagingTable.errosValidacao,
      status: fornecedorProdutosStagingTable.status,
      criadoEm: fornecedorProdutosStagingTable.criadoEm,
      atualizadoEm: fornecedorProdutosStagingTable.atualizadoEm,
      produtoVinculadoNome: productTable.name,
      produtoVinculadoSku: productTable.sku,
    })
    .from(fornecedorProdutosStagingTable)
    .leftJoin(
      productTable,
      eq(productTable.id, fornecedorProdutosStagingTable.produtoLocalizadoId),
    )
    .where(eq(fornecedorProdutosStagingTable.importacaoId, importacaoId))
    .orderBy(asc(fornecedorProdutosStagingTable.criadoEm));
}
