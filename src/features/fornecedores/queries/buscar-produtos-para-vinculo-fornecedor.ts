import "server-only";

import { and, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import { categoryTable, marcaTable, productTable } from "@/db/schema";
import { executarLeituraFornecedores } from "@/features/fornecedores/lib/leitura-segura-fornecedores";

import { buscaProdutoVinculoFornecedorSchema } from "../schemas/fornecedores.schema";
import type { ProdutoParaVinculoFornecedor } from "../types/fornecedores.types";

export async function buscarProdutosParaVinculoFornecedor(
  entrada: unknown,
): Promise<ProdutoParaVinculoFornecedor[]> {
  const filtros = buscaProdutoVinculoFornecedorSchema.parse(entrada);

  if (!filtros.busca) {
    return [];
  }

  const produtos = await executarLeituraFornecedores(
    {
      etapa: "vinculacao:buscar-produtos-da-loja",
      mensagemAmigavel:
        "Não foi possível buscar produtos da loja agora. Tente novamente em alguns segundos.",
    },
    () =>
      db
        .select({
          id: productTable.id,
          nome: productTable.name,
          sku: productTable.sku,
          slug: productTable.slug,
          marca: marcaTable.nome,
          categoria: categoryTable.name,
          precoCentavos: sql<number | null>`(
        select preco.price_in_cents
        from product_pricing preco
        where preco.product_id = ${productTable.id}
          and preco.is_active = true
        order by preco.main_card_price desc nulls last, preco.created_at asc
        limit 1
      )`,
        })
        .from(productTable)
        .leftJoin(categoryTable, eq(productTable.categoryId, categoryTable.id))
        .leftJoin(marcaTable, eq(productTable.marcaId, marcaTable.id))
        .where(
          and(
            eq(productTable.isActive, true),
            or(
              ilike(productTable.name, `%${filtros.busca}%`),
              ilike(productTable.sku, `%${filtros.busca}%`),
              ilike(productTable.productCode, `%${filtros.busca}%`),
              ilike(productTable.internalCode, `%${filtros.busca}%`),
              ilike(marcaTable.nome, `%${filtros.busca}%`),
              ilike(productTable.slug, `%${filtros.busca}%`),
            ),
          ),
        )
        .limit(filtros.limite),
  );

  return produtos.map(({ precoCentavos, ...produto }) => ({
    ...produto,
    preco:
      typeof precoCentavos === "number"
        ? (precoCentavos / 100).toFixed(2)
        : null,
  }));
}
