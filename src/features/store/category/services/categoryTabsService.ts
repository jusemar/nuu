// src/features/store/category/services/categoryTabsService.ts
"use server";

import { db } from "@/db/connection";
import { categoryTable, productTable } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
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
          const result = await db
            .select({ count: sql<number>`count(*)` })
            .from(productTable)
            .where(
              and(
                eq(productTable.categoryId, sub.id),
                eq(productTable.isActive, true),
                eq(productTable.status, "published"),
              ),
            );

          const count = Number(result[0]?.count || 0);

          return {
            id: sub.id,
            name: sub.name,
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
