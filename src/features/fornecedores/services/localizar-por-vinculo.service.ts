import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedorProdutoVinculosTable, productTable } from "@/db/schema";

import type { ResultadoLocalizacaoPorVinculoFornecedor } from "../types/fornecedores.types";

function normalizarCodigoFornecedor(codigo: string | null) {
  const normalizado = codigo?.trim();
  return normalizado && normalizado.length > 0 ? normalizado : null;
}

export async function localizarProdutosPorVinculoFornecedor(
  fornecedorId: string,
  codigosFornecedor: Array<string | null>,
): Promise<ResultadoLocalizacaoPorVinculoFornecedor> {
  const codigosUnicos = Array.from(
    new Set(
      codigosFornecedor
        .map(normalizarCodigoFornecedor)
        .filter((codigo): codigo is string => Boolean(codigo)),
    ),
  );

  if (codigosUnicos.length === 0) {
    return {
      encontradosPorCodigo: new Map(),
      codigosSemVinculo: [],
    };
  }

  const vinculos = await db
    .select({
      codigoFornecedor: fornecedorProdutoVinculosTable.codigoFornecedor,
      produtoId: fornecedorProdutoVinculosTable.produtoId,
      sku: productTable.sku,
    })
    .from(fornecedorProdutoVinculosTable)
    .innerJoin(
      productTable,
      eq(productTable.id, fornecedorProdutoVinculosTable.produtoId),
    )
    .where(
      and(
        eq(fornecedorProdutoVinculosTable.fornecedorId, fornecedorId),
        eq(fornecedorProdutoVinculosTable.status, "ativo"),
        inArray(fornecedorProdutoVinculosTable.codigoFornecedor, codigosUnicos),
      ),
    );

  const encontradosPorCodigo = new Map(
    vinculos.map((vinculo) => [
      vinculo.codigoFornecedor,
      {
        codigoFornecedor: vinculo.codigoFornecedor,
        produtoId: vinculo.produtoId,
        sku: vinculo.sku,
      },
    ]),
  );

  return {
    encontradosPorCodigo,
    codigosSemVinculo: codigosUnicos.filter(
      (codigo) => !encontradosPorCodigo.has(codigo),
    ),
  };
}
