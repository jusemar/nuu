import "server-only";

import { and, eq, ilike, or } from "drizzle-orm";

import { db } from "@/db/connection";
import { productTable } from "@/db/schema";

import { buscaProdutoVinculoFornecedorSchema } from "../schemas/fornecedores.schema";
import type { ProdutoParaVinculoFornecedor } from "../types/fornecedores.types";

export async function buscarProdutosParaVinculoFornecedor(
  entrada: unknown,
): Promise<ProdutoParaVinculoFornecedor[]> {
  const filtros = buscaProdutoVinculoFornecedorSchema.parse(entrada);

  if (!filtros.busca) {
    return [];
  }

  const produtos = await db
    .select({
      id: productTable.id,
      nome: productTable.name,
      sku: productTable.sku,
      slug: productTable.slug,
      marca: productTable.brand,
    })
    .from(productTable)
    .where(
      and(
        eq(productTable.isActive, true),
        or(
          ilike(productTable.name, `%${filtros.busca}%`),
          ilike(productTable.sku, `%${filtros.busca}%`),
          ilike(productTable.brand, `%${filtros.busca}%`),
          ilike(productTable.slug, `%${filtros.busca}%`),
        ),
      ),
    )
    .limit(filtros.limite);

  return produtos;
}
