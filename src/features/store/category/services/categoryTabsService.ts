// src/features/store/category/services/categoryTabsService.ts
"use server";

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import { categoryTable, productTable } from "@/db/schema";
import { buscarArvoreCategoriaPublica } from "@/features/store/category/queries/buscar-arvore-categoria-publica";
import {
  descreverErroBancoParaLog,
  erroEhTransitorioDeBanco,
  executarLeituraComRetry,
} from "@/lib/db/classificar-erro-banco";

// =====================================================================
// TIPO: TabItem (igual ao do componente)
// =====================================================================
export interface TabItem {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

// =====================================================================
// FUNÇÃO: getSubcategoryTabs
// =====================================================================
// Busca as subcategorias (nível 2) de uma categoria (nível 1)
// e conta quantos produtos cada uma tem
// =====================================================================
export async function getSubcategoryTabs(
  parentCategoryId: string,
): Promise<TabItem[]> {
  try {
    return await executarLeituraComRetry("categorias:loja:tabs", async () => {
      // Busca todas as subcategorias ativas que têm este pai
      const subcategories = await db
        .select({
          id: categoryTable.id,
          name: categoryTable.name,
          slug: categoryTable.slug,
        })
        .from(categoryTable)
        .where(
          and(
            eq(categoryTable.parentId, parentCategoryId),
            eq(categoryTable.isActive, true),
          ),
        )
        .orderBy(categoryTable.orderIndex);

      // Para cada subcategoria, conta quantos produtos existem
      const tabsWithCounts = await Promise.all(
        subcategories.map(async (sub) => {
          const arvoreSubcategoria = await buscarArvoreCategoriaPublica(sub.id);
          const categoriasIds = arvoreSubcategoria.map(
            (categoria) => categoria.id,
          );

          const result = await db
            .select({ count: sql<number>`count(*)` })
            .from(productTable)
            .where(
              and(
                inArray(productTable.categoryId, categoriasIds),
                eq(productTable.isActive, true),
                eq(productTable.status, "published"),
                sql`coalesce(${productTable.storeProductFlags}, ARRAY[]::text[]) @> ARRAY['general']::text[]`,
              ),
            );

          const count = Number(result[0]?.count || 0);

          return {
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            count: count > 0 ? count : undefined, // Só mostra se tiver produtos
          };
        }),
      );

      // Filtra apenas categorias que têm produtos
      return tabsWithCounts.filter((tab) => tab.count !== undefined);
    });
  } catch (error) {
    console.error(
      "[categorias:loja:tabs:erro]",
      descreverErroBancoParaLog(error),
    );
    throw new Error(
      erroEhTransitorioDeBanco(error)
        ? "BANCO_INDISPONIVEL"
        : "ERRO_INTERNO_CATEGORIA",
    );
  }
}
