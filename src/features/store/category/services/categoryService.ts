// src/features/store/category/services/categoryService.ts
'use server'

import { db } from '@/db'
import { categoryTable, productTable } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'

export interface TabItem {
  id: string
  name: string
  slug: string
  level: number
  parentId: string | null
  productCount?: number
  isActive?: boolean
}

// =====================================================================
// FUNÇÃO CORRIGIDA: getCategoryTabs
// =====================================================================
// REGRA CORRETA:
// - Recebe uma categoria de NÍVEL 1 (ex: Colchão de Espuma)
// - Busca suas FILHAS que são NÍVEL 2 (ex: D20, D23, D28)
// - Retorna como tabs para a PLP
// =====================================================================
export async function getCategoryTabs(categoryId: string): Promise<TabItem[]> {
  try {
    // =================================================================
    // PASSO 1: Verifica se a categoria tem FILHAS (nível 2)
    // =================================================================
    const subcategories = await db
      .select({
        id: categoryTable.id,
        name: categoryTable.name,
        slug: categoryTable.slug,
        level: categoryTable.level,
        parentId: categoryTable.parentId,
      })
      .from(categoryTable)
      .where(
        and(
          eq(categoryTable.parentId, categoryId),  // Filhas desta categoria
          eq(categoryTable.isActive, true)
        )
      )
      .orderBy(categoryTable.orderIndex)

    // Se não tem filhas, retorna array vazio (sem tabs)
    if (subcategories.length === 0) {
      return []
    }

    // =================================================================
    // PASSO 2: Conta produtos de cada subcategoria (nível 2)
    // =================================================================
    const tabsWithCounts = await Promise.all(
      subcategories.map(async (sub) => {
        const result = await db
          .select({ count: sql<number>`count(*)` })
          .from(productTable)
          .where(eq(productTable.categoryId, sub.id))

        const productCount = Number(result[0]?.count || 0)

        return {
          ...sub,
          productCount,
          isActive: false,
        }
      })
    )

    // =================================================================
    // PASSO 3: Retorna as tabs (sem "Todos" - isso fica no componente)
    // =================================================================
    return tabsWithCounts
  } catch (error) {
    console.error('Erro ao buscar tabs de categoria:', error)
    return []
  }
}