import "server-only";

import { asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedorProdutoVinculosTable, productTable } from "@/db/schema";

import type { ProdutoVinculadoFornecedorAdmin } from "../types/fornecedores.types";

export async function listarVinculosProdutosFornecedoresAdmin(
  fornecedoresIds: string[],
): Promise<ProdutoVinculadoFornecedorAdmin[]> {
  if (fornecedoresIds.length === 0) {
    return [];
  }

  const vinculos = await db
    .select({
      id: fornecedorProdutoVinculosTable.id,
      fornecedorId: fornecedorProdutoVinculosTable.fornecedorId,
      produtoId: fornecedorProdutoVinculosTable.produtoId,
      produtoNome: productTable.name,
      produtoSku: productTable.sku,
      produtoMarca: productTable.brand,
      codigoFornecedor: fornecedorProdutoVinculosTable.codigoFornecedor,
      tipoVinculo: fornecedorProdutoVinculosTable.tipoVinculo,
      status: fornecedorProdutoVinculosTable.status,
      criadoEm: fornecedorProdutoVinculosTable.criadoEm,
      atualizadoEm: fornecedorProdutoVinculosTable.atualizadoEm,
    })
    .from(fornecedorProdutoVinculosTable)
    .innerJoin(
      productTable,
      eq(productTable.id, fornecedorProdutoVinculosTable.produtoId),
    )
    .where(inArray(fornecedorProdutoVinculosTable.fornecedorId, fornecedoresIds))
    .orderBy(
      asc(fornecedorProdutoVinculosTable.fornecedorId),
      asc(productTable.name),
    );

  return vinculos;
}
