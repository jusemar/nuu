"use server";
// =====================================================================
// SERVER ACTIONS - CATEGORIAS
// =====================================================================
// Este arquivo contém todas as funções que acessam o banco de dados.
// A diretiva 'use server' no topo garante que estas funções rodem
// APENAS no servidor, nunca no navegador do cliente.
//
// ARQUITETURA: Feature-based (modular por domínio)
// TECNOLOGIAS: Next.js App Router, Drizzle ORM, PostgreSQL
// =====================================================================

import { db } from "@/db";
import { categoryTable } from "@/db/table/categories/categories";
import { sql, eq, desc, asc } from "drizzle-orm";
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../types";

// =====================================================================
// FUNÇÃO AUXILIAR: inserir subcategorias recursivamente
// =====================================================================
async function insertSubcategories(subs: any[], parentId?: string) {
  for (let i = 0; i < subs.length; i++) {
    const sub = subs[i];

    const [newSub] = await db
      .insert(categoryTable)
      .values({
        name: sub.name,
        slug: sub.slug,
        description: sub.description || null,
        level: sub.level || 1,
        parentId: parentId || null,
        orderIndex: sub.orderIndex || i + 1,
        imageUrl: sub.imageUrl || null,
        metaTitle: sub.metaTitle || null,
        metaDescription: sub.metaDescription || null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (sub.children?.length) {
      await insertSubcategories(sub.children, newSub.id);
    }
  }
}

// =====================================================================
// 1. BUSCAR TODAS AS CATEGORIAS (LISTAGEM)
// =====================================================================
export async function getAllCategories(): Promise<Category[]> {
  try {
    const categories = await db
      .select({
        id: categoryTable.id,
        name: categoryTable.name,
        slug: categoryTable.slug,
        description: categoryTable.description,
        parentId: categoryTable.parentId,
        level: categoryTable.level,
        orderIndex: categoryTable.orderIndex,
        imageUrl: categoryTable.imageUrl,
        metaTitle: categoryTable.metaTitle,
        metaDescription: categoryTable.metaDescription,
        isActive: categoryTable.isActive,
        createdAt: categoryTable.createdAt,
        updatedAt: categoryTable.updatedAt,
      })
      .from(categoryTable)
      .orderBy(desc(categoryTable.updatedAt));

    // Converte os dados para o formato esperado pelo tipo Category
    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      parentId: cat.parentId,
      level: cat.level ?? 0,
      orderIndex: cat.orderIndex ?? 1,
      imageUrl: cat.imageUrl,
      metaTitle: cat.metaTitle,
      metaDescription: cat.metaDescription,
      isActive: cat.isActive,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));
  } catch (error) {
    throw new Error("Falha ao carregar categorias");
  }
}

// =====================================================================
// 2. BUSCAR CATEGORIA POR ID (DETALHES)
// =====================================================================
/**
 * Busca uma categoria específica pelo ID, incluindo suas subcategorias
 *
 * @param id - ID da categoria a ser buscada
 * @returns Promise<Category | null> - Categoria encontrada ou null
 */

// =====================================================================
// 2. BUSCAR CATEGORIA POR ID (DETALHES)
// =====================================================================
export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    // 1. Busca a categoria principal
    const mainCategory = await db
      .select({
        id: categoryTable.id,
        name: categoryTable.name,
        slug: categoryTable.slug,
        description: categoryTable.description,
        parentId: categoryTable.parentId,
        level: categoryTable.level,
        orderIndex: categoryTable.orderIndex,
        imageUrl: categoryTable.imageUrl,
        metaTitle: categoryTable.metaTitle,
        metaDescription: categoryTable.metaDescription,
        isActive: categoryTable.isActive,
        createdAt: categoryTable.createdAt,
        updatedAt: categoryTable.updatedAt,
      })
      .from(categoryTable)
      .where(eq(categoryTable.id, id))
      .limit(1)

    if (!mainCategory.length) return null

    // 2. Busca TODAS as subcategorias com CTE recursiva (SQL raw)
    const allSubs = await db.execute(sql`
      WITH RECURSIVE category_tree AS (
        -- Âncora: filhos diretos
        SELECT 
          id, name, slug, description, parent_id, level, order_index,
          image_url, meta_title, meta_description, is_active,
          created_at, updated_at
        FROM category
        WHERE parent_id = ${id}
        
        UNION ALL
        
        -- Recursão: filhos dos filhos
        SELECT 
          c.id, c.name, c.slug, c.description, c.parent_id, c.level, c.order_index,
          c.image_url, c.meta_title, c.meta_description, c.is_active,
          c.created_at, c.updated_at
        FROM category c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
      )
      SELECT * FROM category_tree
      ORDER BY level, order_index;
    `)

    console.log('📦 CTE retornou:', allSubs.rows.length, 'subcategorias')

    const category = mainCategory[0]
    
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentId: category.parentId,
      level: category.level ?? 0,
      orderIndex: category.orderIndex ?? 1,
      imageUrl: category.imageUrl,
      metaTitle: category.metaTitle,
      metaDescription: category.metaDescription,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      subcategories: allSubs.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        parentId: row.parent_id,
        level: row.level,
        orderIndex: row.order_index,
        imageUrl: row.image_url,
        metaTitle: row.meta_title,
        metaDescription: row.meta_description,
        isActive: row.is_active,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }))
    }
  } catch (error) {
    console.error('❌ [getCategoryById] Erro:', error)
    throw new Error('Falha ao carregar categoria')
  }
}

// =====================================================================
// 3. CRIAR NOVA CATEGORIA
// =====================================================================
export async function createCategory(data: CreateCategoryInput) {
  try {
    const [newCategory] = await db
      .insert(categoryTable)
      .values({
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        isActive: data.isActive ?? true,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        orderIndex: data.orderIndex ?? 1,
        level: 0,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (data.subcategories?.length) {
      await insertSubcategories(data.subcategories, newCategory.id);
    }

    return {
      ...newCategory,
      orderIndex: newCategory.orderIndex ?? 1,
    };
  } catch (error) {
    throw new Error("Falha ao criar categoria");
  }
}

// =====================================================================
// 4. ATUALIZAR CATEGORIA EXISTENTE
// =====================================================================
export async function updateCategory(id: string, data: UpdateCategoryInput) {
  try {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined)
      updateData.metaDescription = data.metaDescription;
    if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex;

    await db
      .update(categoryTable)
      .set(updateData)
      .where(eq(categoryTable.id, id));

    return { success: true };
  } catch (error) {
    console.error("❌ [updateCategory] Erro:", error);
    throw new Error("Falha ao atualizar categoria");
  }
}

// =====================================================================
// 5. EXCLUIR CATEGORIA (SOFT OU HARD DELETE)
// =====================================================================
export async function deleteCategory(
  id: string,
  type: "soft" | "hard" = "soft",
) {
  try {
    if (type === "hard") {
      await db.delete(categoryTable).where(eq(categoryTable.id, id));
    } else {
      await db
        .update(categoryTable)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(categoryTable.id, id));
    }
    return { success: true };
  } catch (error) {
    console.error("❌ [deleteCategory] Erro:", error);
    throw new Error("Falha ao excluir categoria");
  }
}

// =====================================================================
// 6. RESTAURAR CATEGORIA INATIVA
// =====================================================================
export async function restoreCategory(id: string) {
  try {
    await db
      .update(categoryTable)
      .set({
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(categoryTable.id, id));
    return { success: true };
  } catch (error) {
    console.error("❌ [restoreCategory] Erro:", error);
    throw new Error("Falha ao restaurar categoria");
  }
}

// =====================================================================
// 7. BUSCAR CATEGORIAS POR NÍVEL
// =====================================================================
export async function getCategoriesByLevel(level: number = 0) {
  try {
    return await db
      .select({
        id: categoryTable.id,
        name: categoryTable.name,
        slug: categoryTable.slug,
        level: categoryTable.level,
      })
      .from(categoryTable)
      .where(eq(categoryTable.level, level))
      .orderBy(asc(categoryTable.orderIndex));
  } catch (error) {
    console.error("❌ [getCategoriesByLevel] Erro:", error);
    throw new Error("Falha ao buscar categorias por nível");
  }
}
