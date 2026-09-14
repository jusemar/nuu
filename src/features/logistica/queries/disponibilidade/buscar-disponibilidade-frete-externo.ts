import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { categoryTable, productTable } from "@/db/schema";

import {
  montarCadeiaCategoriasFreteExterno,
  resolverDisponibilidadeFreteExterno,
} from "../../lib/disponibilidade/resolver-disponibilidade-frete-externo";
import type {
  CategoriaCadeiaFreteExterno,
  DisponibilidadeFreteExterno,
  ModoDisponibilidadeFreteExterno,
} from "../../types/disponibilidade-frete-externo";

/**
 * Cadeia de categorias (da informada até a raiz) com o modo de cada uma.
 * A árvore de categorias é pequena; carregar id/pai/modo evita N consultas.
 */
export async function buscarCadeiaCategoriasFreteExterno(
  categoriaId: string | null | undefined,
): Promise<CategoriaCadeiaFreteExterno[]> {
  if (!categoriaId) return [];

  const categorias = await db
    .select({
      id: categoryTable.id,
      nome: categoryTable.name,
      parentId: categoryTable.parentId,
      modo: categoryTable.disponibilidadeFreteExterno,
    })
    .from(categoryTable);

  return montarCadeiaCategoriasFreteExterno(categorias, categoriaId);
}

/**
 * Leitura oficial do gate do Frete Externo de um produto, usada pelo motor de
 * disponibilidade (PDP, checkout e Merchant) e pelo Admin.
 */
export async function buscarDisponibilidadeFreteExternoProduto({
  produtoId,
  categoriaId,
  modoProduto,
}: {
  produtoId: string;
  /** Quando omitida, usa a categoria gravada do produto. */
  categoriaId?: string | null;
  /** Quando omitido, usa o modo gravado do produto. */
  modoProduto?: ModoDisponibilidadeFreteExterno;
}): Promise<DisponibilidadeFreteExterno> {
  const produto =
    modoProduto === undefined || categoriaId === undefined
      ? await db.query.productTable.findFirst({
          columns: { categoryId: true, disponibilidadeFreteExterno: true },
          where: eq(productTable.id, produtoId),
        })
      : null;

  return resolverDisponibilidadeFreteExterno({
    modoProduto:
      modoProduto ?? produto?.disponibilidadeFreteExterno ?? "herdar",
    cadeiaCategorias: await buscarCadeiaCategoriasFreteExterno(
      categoriaId === undefined ? (produto?.categoryId ?? null) : categoriaId,
    ),
  });
}
