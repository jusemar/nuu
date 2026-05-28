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

import { db } from "@/db/connection";
import { categoryTable } from "@/db/table/categories/categories";
import { productTable } from "@/db/table/products/products";
import { sql, eq, desc, asc, inArray } from "drizzle-orm";
import type {
  Category,
  CreateCategoryInput,
  HierarchicalSubcategory,
  UpdateCategoryInput,
} from "../types";

type SubcategoryNode = HierarchicalSubcategory & {
  id?: string;
  imageUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isActive?: boolean;
};

type ExistingSubcategory = {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  level: number;
  orderIndex: number | null;
  imageUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isActive: boolean;
};

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

async function getDescendantCategories(
  parentId: string,
  tx: any = db,
): Promise<ExistingSubcategory[]> {
  const result = await tx.execute(sql`
    WITH RECURSIVE category_tree AS (
      SELECT
        id, name, description, parent_id, level, order_index,
        image_url, meta_title, meta_description, is_active
      FROM category
      WHERE parent_id = ${parentId}

      UNION ALL

      SELECT
        c.id, c.name, c.description, c.parent_id, c.level, c.order_index,
        c.image_url, c.meta_title, c.meta_description, c.is_active
      FROM category c
      INNER JOIN category_tree ct ON c.parent_id = ct.id
    )
    SELECT
      id, name, description, parent_id, level, order_index,
      image_url, meta_title, meta_description, is_active
    FROM category_tree
    ORDER BY level DESC, order_index;
  `);

  return result.rows.map((row: any): ExistingSubcategory => ({
    id: row.id,
    name: row.name,
    description: row.description,
    parentId: row.parent_id,
    level: row.level,
    orderIndex: row.order_index,
    imageUrl: row.image_url,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    isActive: row.is_active,
  }));
}

async function getProductCountsByCategoryIds(
  categoryIds: string[],
  tx: any = db,
): Promise<Map<string, number>> {
  if (categoryIds.length === 0) return new Map<string, number>();

  const rows = await tx
    .select({
      categoryId: productTable.categoryId,
      total: sql<number>`count(*)::int`,
    })
    .from(productTable)
    .where(inArray(productTable.categoryId, categoryIds))
    .groupBy(productTable.categoryId);

  return new Map(rows.map((row: any) => [row.categoryId, Number(row.total)]));
}

async function syncSubcategories(params: {
  tx: any;
  subcategories: SubcategoryNode[];
  parentId: string;
  existingById: Map<string, ExistingSubcategory>;
  touchedIds: Set<string>;
}) {
  const { tx, subcategories, parentId, existingById, touchedIds } = params;

  for (let i = 0; i < subcategories.length; i++) {
    const subcategory = subcategories[i];
    const orderIndex = subcategory.orderIndex || i + 1;

    if (subcategory.id && existingById.has(subcategory.id)) {
      const existing = existingById.get(subcategory.id)!;

      await tx
        .update(categoryTable)
        .set({
          name: subcategory.name,
          description:
            subcategory.description !== undefined
              ? subcategory.description || null
              : existing.description,
          level: subcategory.level || existing.level,
          parentId,
          orderIndex,
          imageUrl:
            subcategory.imageUrl !== undefined
              ? subcategory.imageUrl || null
              : existing.imageUrl,
          metaTitle:
            subcategory.metaTitle !== undefined
              ? subcategory.metaTitle || null
              : existing.metaTitle,
          metaDescription:
            subcategory.metaDescription !== undefined
              ? subcategory.metaDescription || null
              : existing.metaDescription,
          isActive: subcategory.isActive ?? existing.isActive,
          updatedAt: new Date(),
        })
        .where(eq(categoryTable.id, subcategory.id));

      touchedIds.add(subcategory.id);
      console.log(
        `🟢 [updateCategory] Subcategoria atualizada: ${subcategory.name} (${subcategory.id})`,
      );

      if (subcategory.children?.length) {
        await syncSubcategories({
          tx,
          subcategories: subcategory.children,
          parentId: subcategory.id,
          existingById,
          touchedIds,
        });
      }

      continue;
    }

    const [newSubcategory] = await tx
      .insert(categoryTable)
      .values({
        name: subcategory.name,
        slug: subcategory.slug,
        description: subcategory.description || null,
        level: subcategory.level || 1,
        parentId,
        orderIndex,
        imageUrl: subcategory.imageUrl || null,
        metaTitle: subcategory.metaTitle || null,
        metaDescription: subcategory.metaDescription || null,
        isActive: subcategory.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    touchedIds.add(newSubcategory.id);
    console.log(
      `🟢 [updateCategory] Subcategoria criada: ${newSubcategory.name} (${newSubcategory.id})`,
    );

    if (subcategory.children?.length) {
      await syncSubcategories({
        tx,
        subcategories: subcategory.children,
        parentId: newSubcategory.id,
        existingById,
        touchedIds,
      });
    }
  }
}

function collectExistingSubcategoryIds(
  subcategories: SubcategoryNode[],
  existingById: Map<string, ExistingSubcategory>,
  touchedIds = new Set<string>(),
) {
  for (const subcategory of subcategories) {
    if (subcategory.id && existingById.has(subcategory.id)) {
      touchedIds.add(subcategory.id);
    }

    if (subcategory.children?.length) {
      collectExistingSubcategoryIds(
        subcategory.children,
        existingById,
        touchedIds,
      );
    }
  }

  return touchedIds;
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

    const category = mainCategory[0]

// Cria um mapa de todos os itens para fácil acesso
const itemMap = new Map()
allSubs.rows.forEach((row: any) => {
  itemMap.set(row.id, {
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
    children: [] // Inicia com array vazio para os filhos
  })
})

// Constrói a árvore: para cada item, coloca no children do pai
const roots: any[] = []
itemMap.forEach((item) => {
  if (item.parentId) {
    const parent = itemMap.get(item.parentId)
    if (parent) {
      parent.children.push(item)
    } else {
      // Se não encontrar o pai, considera como raiz (fallback)
      roots.push(item)
    }
  } else {
    roots.push(item)
  }
})

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
  subcategories: roots // ← AGORA É UMA ÁRVORE!
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
  console.error('❌ [createCategory] Erro detalhado:', error)
  throw new Error(`Falha ao criar categoria: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
}
}


// =====================================================================
// 4. ATUALIZAR CATEGORIA EXISTENTE
// =====================================================================
export async function updateCategory(id: string, data: UpdateCategoryInput) {
  
  try {
    let existingSubcategories: ExistingSubcategory[] = [];
    let existingById = new Map<string, ExistingSubcategory>();
    let removedSubcategories: ExistingSubcategory[] = [];

    if (data.subcategories) {
      existingSubcategories = await getDescendantCategories(id);
      existingById = new Map(
        existingSubcategories.map((subcategory) => [subcategory.id, subcategory]),
      );

      const incomingExistingIds = collectExistingSubcategoryIds(
        data.subcategories,
        existingById,
      );

      removedSubcategories = existingSubcategories.filter(
        (subcategory) => !incomingExistingIds.has(subcategory.id),
      );

      const productCounts = await getProductCountsByCategoryIds(
        removedSubcategories.map((subcategory) => subcategory.id),
      );

      for (const subcategory of removedSubcategories) {
        const productsCount = productCounts.get(subcategory.id) || 0;

        if (productsCount > 0) {
          console.log(
            `🟡 [updateCategory] Subcategoria bloqueada por produtos vinculados: ${subcategory.name} (${subcategory.id}) - ${productsCount} produto(s)`,
          );
          throw new Error(
            `A subcategoria "${subcategory.name}" possui ${productsCount} produto(s) vinculado(s). Remova ou mova esses produtos antes de excluir a subcategoria.`,
          );
        }
      }
    }

    // =================================================================
    // PASSO 1: Atualiza a categoria principal
    // =================================================================
    const updateData: any = {
      updatedAt: new Date() // Sempre atualiza a data de modificação
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

    console.log(`🟢 [updateCategory] Categoria atualizada: ${id}`)

    // =================================================================
    // PASSO 2: Sincroniza subcategorias sem apagar tudo e recriar
    // =================================================================
    if (data.subcategories) {
      const touchedIds = new Set<string>();

      if (data.subcategories.length > 0) {
        await syncSubcategories({
          tx: db,
          subcategories: data.subcategories,
          parentId: id,
          existingById,
          touchedIds,
        });
      }

      for (const subcategory of removedSubcategories) {
        await db.delete(categoryTable).where(eq(categoryTable.id, subcategory.id));
        console.log(
          `🟢 [updateCategory] Subcategoria removida sem produtos vinculados: ${subcategory.name} (${subcategory.id})`,
        );
      }
    }

    console.log('🟢 [updateCategory] Categoria e subcategorias atualizadas com sucesso!')
    return { success: true }
    
  } catch (error) {
    console.error('❌ [updateCategory] Erro:', error)
    throw new Error(
      error instanceof Error ? error.message : 'Falha ao atualizar categoria',
    )
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
