'use server'
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

import { db } from '@/db'
import { categoryTable } from '@/db/table/categories/categories'
import { eq, desc, asc } from 'drizzle-orm'
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../types'

// =====================================================================
// FUNÇÃO AUXILIAR: inserir subcategorias recursivamente
// =====================================================================
async function insertSubcategories(subs: any[], parentId?: string) {
  for (let i = 0; i < subs.length; i++) {
    const sub = subs[i]
    
    const [newSub] = await db
      .insert(categoryTable)
      .values({
        name: sub.name,
        slug: sub.slug,
        description: sub.description || null,
        level: sub.level || 1,
        parentId: parentId || null,
        orderIndex: sub.orderIndex || (i + 1),
        imageUrl: sub.imageUrl || null,
        metaTitle: sub.metaTitle || null,
        metaDescription: sub.metaDescription || null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()

    if (sub.children?.length) {
      await insertSubcategories(sub.children, newSub.id)
    }
  }
}

// =====================================================================
// 1. BUSCAR TODAS AS CATEGORIAS (LISTAGEM)
// =====================================================================
export async function getAllCategories(): Promise<Category[]> {
   console.log('🔍 [getAllCategories] Função executada')
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
      .orderBy(desc(categoryTable.updatedAt))

 console.log('📦 CATEGORIAS DO BANCO (ORDENADAS):')
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} - ${cat.updatedAt}`)
    })   

    // Converte os dados para o formato esperado pelo tipo Category
    return categories.map(cat => ({
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
    }))
  } catch (error) {
  
    throw new Error('Falha ao carregar categorias')
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
    // Busca a categoria principal
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

    // Busca as subcategorias
    const subcategories = await db
      .select({
        id: categoryTable.id,
        name: categoryTable.name,
        slug: categoryTable.slug,
        description: categoryTable.description,
        parentId: categoryTable.parentId,
        level: categoryTable.level,
        orderIndex: categoryTable.orderIndex,
        // ⚠️ Não selecione campos que não existem em HierarchicalSubcategory
      })
      .from(categoryTable)
      .where(eq(categoryTable.parentId, id))
      .orderBy(asc(categoryTable.orderIndex))

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
      // ⚠️ Mapeamento correto para HierarchicalSubcategory
      subcategories: subcategories.map(sub => ({
        name: sub.name,
        slug: sub.slug,
        description: sub.description || undefined,
        level: sub.level ?? 1,
        parentId: sub.parentId || undefined,
        orderIndex: sub.orderIndex ?? 1,
        // ⚠️ NÃO INCLUA: id, isActive, imageUrl, metaTitle, metaDescription, createdAt, updatedAt
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
        updatedAt: new Date()
      })
      .returning()

    if (data.subcategories?.length) {
      await insertSubcategories(data.subcategories, newCategory.id)
    }

    return newCategory
  } catch (error) {
    console.error('❌ [createCategory] Erro:', error)
    throw new Error('Falha ao criar categoria')
  }
}

// =====================================================================
// 4. ATUALIZAR CATEGORIA EXISTENTE
// =====================================================================
export async function updateCategory(id: string, data: UpdateCategoryInput) {
  try {
    const updateData: any = {
      updatedAt: new Date()
    }

    if (data.name !== undefined) updateData.name = data.name
    if (data.slug !== undefined) updateData.slug = data.slug
    if (data.description !== undefined) updateData.description = data.description
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle
    if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription
    if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex

    await db
      .update(categoryTable)
      .set(updateData)
      .where(eq(categoryTable.id, id))

    return { success: true }
  } catch (error) {
    console.error('❌ [updateCategory] Erro:', error)
    throw new Error('Falha ao atualizar categoria')
  }
}

// =====================================================================
// 5. EXCLUIR CATEGORIA (SOFT OU HARD DELETE)
// =====================================================================
export async function deleteCategory(id: string, type: 'soft' | 'hard' = 'soft') {
  try {
    if (type === 'hard') {
      await db.delete(categoryTable).where(eq(categoryTable.id, id))
    } else {
      await db
        .update(categoryTable)
        .set({ 
          isActive: false, 
          updatedAt: new Date() 
        })
        .where(eq(categoryTable.id, id))
    }
    return { success: true }
  } catch (error) {
    console.error('❌ [deleteCategory] Erro:', error)
    throw new Error('Falha ao excluir categoria')
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
        updatedAt: new Date() 
      })
      .where(eq(categoryTable.id, id))
    return { success: true }
  } catch (error) {
    console.error('❌ [restoreCategory] Erro:', error)
    throw new Error('Falha ao restaurar categoria')
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
      .orderBy(asc(categoryTable.orderIndex))
  } catch (error) {
    console.error('❌ [getCategoriesByLevel] Erro:', error)
    throw new Error('Falha ao buscar categorias por nível')
  }
}