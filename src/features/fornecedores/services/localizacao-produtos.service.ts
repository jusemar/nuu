import { inArray } from "drizzle-orm";

import { db } from "@/db/connection";
import { productTable } from "@/db/schema";

import type { ResultadoLocalizacaoProdutosFornecedor } from "../types/fornecedores.types";

function normalizarCodigoFornecedor(codigo: string | null) {
  const normalizado = codigo?.trim();
  return normalizado && normalizado.length > 0 ? normalizado : null;
}

export async function localizarProdutosPorCodigoFornecedorSku(
  codigosFornecedor: Array<string | null>,
): Promise<ResultadoLocalizacaoProdutosFornecedor> {
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
      codigosNaoLocalizados: [],
    };
  }

  const produtos = await db
    .select({
      id: productTable.id,
      sku: productTable.sku,
    })
    .from(productTable)
    .where(inArray(productTable.sku, codigosUnicos));

  const encontradosPorCodigo = new Map(
    produtos.map((produto) => [
      produto.sku,
      {
        codigoFornecedor: produto.sku,
        produtoId: produto.id,
        sku: produto.sku,
      },
    ]),
  );

  return {
    encontradosPorCodigo,
    codigosNaoLocalizados: codigosUnicos.filter(
      (codigo) => !encontradosPorCodigo.has(codigo),
    ),
  };
}
