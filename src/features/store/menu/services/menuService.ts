'use server'

import { db } from '@/db'
import { categoryTable } from '@/db/table/categories/categories'
import { eq, and } from 'drizzle-orm'

export interface MenuCategory {
  id: string
  name: string
  slug: string
  level: number
  parentId: string | null
  children?: MenuCategory[]
}

export async function getActiveCategories(): Promise<MenuCategory[]> {
  try {
    // Busca todas as categorias ativas
    const categories = await db
      .select({
        id: categoryTable.id,
        name: categoryTable.name,
        slug: categoryTable.slug,
        level: categoryTable.level,
        parentId: categoryTable.parentId,
      })
      .from(categoryTable)
      .where(eq(categoryTable.isActive, true))
      .orderBy(categoryTable.level, categoryTable.orderIndex)

    // Constrói a árvore (igual ao que fizemos no seletor)
    const map = new Map<string, MenuCategory>()
    const roots: MenuCategory[] = []

    categories.forEach((cat) => {
      map.set(cat.id, {
        ...cat,
        children: [],
      })
    })

    map.forEach((node) => {
      if (node.parentId) {
        const parent = map.get(node.parentId)
        if (parent) {
          parent.children!.push(node)
        } else {
          roots.push(node)
        }
      } else {
        roots.push(node)
      }
    })

    return roots
  } catch (error) {
    console.error('Erro ao buscar categorias para o menu:', error)
    return []
  }
}