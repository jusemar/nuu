import "server-only";

import { eq, sql } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db/connection";
import { categoryTable } from "@/db/schema";
import {
  descreverErroBancoParaLog,
  erroEhTransitorioDeBanco,
  executarLeituraComRetry,
} from "@/lib/db/classificar-erro-banco";

export type CategoriaBreadcrumb = {
  id: string;
  name: string;
  slug: string;
};

async function consultarBreadcrumbCategoriaPorId(categoriaId: string) {
  const resultado = await db.execute(sql`
    WITH RECURSIVE ancestors AS (
      SELECT id, name, slug, parent_id, 0 AS distance, ARRAY[id] AS path
      FROM category
      WHERE id = ${categoriaId}

      UNION ALL

      SELECT pai.id, pai.name, pai.slug, pai.parent_id,
             ancestors.distance + 1,
             ancestors.path || pai.id
      FROM category pai
      INNER JOIN ancestors ON ancestors.parent_id = pai.id
      WHERE NOT pai.id = ANY(ancestors.path)
    )
    SELECT id, name, slug
    FROM ancestors
    ORDER BY distance DESC
  `);

  return resultado.rows as CategoriaBreadcrumb[];
}

export const buscarBreadcrumbCategoriaPorId = cache(
  async (categoriaId: string) => {
    try {
      return await executarLeituraComRetry(
        "categorias:loja:breadcrumb-por-id",
        () => consultarBreadcrumbCategoriaPorId(categoriaId),
      );
    } catch (erro) {
      console.error(
        "[categorias:loja:breadcrumb-por-id:erro]",
        descreverErroBancoParaLog(erro),
      );
      throw new Error(
        erroEhTransitorioDeBanco(erro)
          ? "BANCO_INDISPONIVEL"
          : "ERRO_INTERNO_CATEGORIA",
      );
    }
  },
);

export const buscarCategoriaPublicaPorSlug = cache(async (slug: string) => {
  try {
    return await executarLeituraComRetry(
      "categorias:loja:por-slug",
      async () => {
        const categoria = await db.query.categoryTable.findFirst({
          where: eq(categoryTable.slug, slug),
        });

        if (!categoria || !categoria.isActive) return null;

        return {
          categoria,
          breadcrumb: await consultarBreadcrumbCategoriaPorId(categoria.id),
        };
      },
    );
  } catch (erro) {
    console.error(
      "[categorias:loja:por-slug:erro]",
      descreverErroBancoParaLog(erro),
    );
    throw new Error(
      erroEhTransitorioDeBanco(erro)
        ? "BANCO_INDISPONIVEL"
        : "ERRO_INTERNO_CATEGORIA",
    );
  }
});
