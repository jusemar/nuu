"use server";

/* eslint-disable @typescript-eslint/no-explicit-any -- contratos legados fora do escopo desta etapa */

import { asc, desc, eq, inArray,sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
import { dbTransacional } from "@/db/transaction";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import {
  descreverErroBancoParaLog,
  erroEhTransitorioDeBanco,
  executarLeituraComRetry,
} from "@/lib/db/classificar-erro-banco";

import {
  calcularNiveisReais,
  obterIdsDescendentes,
} from "../lib/calcular-niveis-categorias";
import { validarSlugCategoria } from "../lib/slug-categoria";
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
  slug: string;
  description: string | null;
  parentId: string | null;
  level: number;
  orderIndex: number | null;
  imageUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isActive: boolean;
};

function revalidarCategorias() {
  try {
    revalidatePath("/admin/categories");
    revalidatePath("/category/[slug]", "page");
    revalidatePath("/");
  } catch (erro) {
    console.warn("[categorias:revalidacao:erro]", {
      tipo: erro instanceof Error ? erro.name : "Erro desconhecido",
    });
  }
}

// =====================================================================
// FUNÇÃO AUXILIAR: inserir subcategorias recursivamente
// =====================================================================
async function insertSubcategories(
  tx: any,
  subs: SubcategoryNode[],
  parentId: string,
  parentLevel: number,
) {
  for (let i = 0; i < subs.length; i++) {
    const sub = subs[i];

    const [newSub] = await tx
      .insert(categoryTable)
      .values({
        name: sub.name,
        slug: sub.slug,
        description: sub.description || null,
        level: parentLevel + 1,
        parentId,
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
      await insertSubcategories(tx, sub.children, newSub.id, parentLevel + 1);
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
        id, name, slug, description, parent_id, level, order_index,
        image_url, meta_title, meta_description, is_active
      FROM category
      WHERE parent_id = ${parentId}

      UNION ALL

      SELECT
        c.id, c.name, c.slug, c.description, c.parent_id, c.level, c.order_index,
        c.image_url, c.meta_title, c.meta_description, c.is_active
      FROM category c
      INNER JOIN category_tree ct ON c.parent_id = ct.id
    )
    SELECT
      id, name, slug, description, parent_id, level, order_index,
      image_url, meta_title, meta_description, is_active
    FROM category_tree
    ORDER BY level DESC, order_index;
  `);

  return result.rows.map(
    (row: any): ExistingSubcategory => ({
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
    }),
  );
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
  parentLevel: number;
}) {
  const { tx, subcategories, parentId, existingById, touchedIds, parentLevel } =
    params;

  for (let i = 0; i < subcategories.length; i++) {
    const subcategory = subcategories[i];
    const orderIndex = subcategory.orderIndex || i + 1;

    if (subcategory.id && existingById.has(subcategory.id)) {
      const existing = existingById.get(subcategory.id)!;

      await tx
        .update(categoryTable)
        .set({
          name: subcategory.name,
          slug: subcategory.slug,
          description:
            subcategory.description !== undefined
              ? subcategory.description || null
              : existing.description,
          level: parentLevel + 1,
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
      console.log("[categorias:admin:subcategoria-atualizada]", {
        nome: subcategory.name,
      });

      if (subcategory.children?.length) {
        await syncSubcategories({
          tx,
          subcategories: subcategory.children,
          parentId: subcategory.id,
          existingById,
          touchedIds,
          parentLevel: parentLevel + 1,
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
        level: parentLevel + 1,
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
    console.log("[categorias:admin:subcategoria-criada]", {
      nome: newSubcategory.name,
    });

    if (subcategory.children?.length) {
      await syncSubcategories({
        tx,
        subcategories: subcategory.children,
        parentId: newSubcategory.id,
        existingById,
        touchedIds,
        parentLevel: parentLevel + 1,
      });
    }
  }
}

function coletarCategoriasDaArvore(categoria: {
  id?: string;
  name: string;
  slug: string;
  subcategories?: SubcategoryNode[];
}) {
  const itens: Array<{ id?: string; name: string; slug: string }> = [];
  const visitar = (item: {
    id?: string;
    name: string;
    slug: string;
    children?: SubcategoryNode[];
  }) => {
    itens.push({ id: item.id, name: item.name.trim(), slug: item.slug.trim() });
    item.children?.forEach(visitar);
  };

  itens.push({
    id: categoria.id,
    name: categoria.name.trim(),
    slug: categoria.slug.trim(),
  });
  categoria.subcategories?.forEach(visitar);
  return itens;
}

function validarArvoreCategorias(categoria: {
  id?: string;
  name: string;
  slug: string;
  subcategories?: SubcategoryNode[];
}) {
  const itens = coletarCategoriasDaArvore(categoria);
  const vistos = new Set<string>();

  for (const item of itens) {
    if (item.name.length < 2)
      throw new Error("O nome da categoria deve ter pelo menos 2 caracteres.");
    const erroSlug = validarSlugCategoria(item.slug);
    if (erroSlug) throw new Error(`${item.name || "Categoria"}: ${erroSlug}`);
    if (vistos.has(item.slug))
      throw new Error(`O slug "${item.slug}" está repetido na hierarquia.`);
    vistos.add(item.slug);
  }

  return itens;
}

async function validarSlugsUnicosNoBanco(
  tx: any,
  itens: Array<{ id?: string; slug: string }>,
) {
  const slugs = itens.map((item) => item.slug);
  if (!slugs.length) return;
  const existentes = await tx
    .select({ id: categoryTable.id, slug: categoryTable.slug })
    .from(categoryTable)
    .where(inArray(categoryTable.slug, slugs));

  const idsDoPayload = new Set(itens.map((item) => item.id).filter(Boolean));
  const conflito = existentes.find(
    (item: { id: string; slug: string }) => !idsDoPayload.has(item.id),
  );
  if (conflito)
    throw new Error(`Já existe uma categoria com o slug "${conflito.slug}".`);
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
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.CATEGORIAS.VISUALIZAR);
  try {
    const categories = await executarLeituraComRetry(
      "categorias:admin:listagem",
      () =>
        db
          .select({
            id: categoryTable.id,
            name: categoryTable.name,
            slug: categoryTable.slug,
            description: categoryTable.description,
            descriptionBottom: categoryTable.descriptionBottom,
            parentId: categoryTable.parentId,
            level: categoryTable.level,
            orderIndex: categoryTable.orderIndex,
            imageUrl: categoryTable.imageUrl,
            metaTitle: categoryTable.metaTitle,
            metaDescription: categoryTable.metaDescription,
            isActive: categoryTable.isActive,
            productCount: sql<number>`(
          select count(*)::int
          from product p
          where p.category_id = category.id
        )`,
            createdAt: categoryTable.createdAt,
            updatedAt: categoryTable.updatedAt,
          })
          .from(categoryTable)
          .orderBy(desc(categoryTable.updatedAt)),
    );

    const niveisReais = calcularNiveisReais(categories);

    // O nível exibido deriva da hierarquia atual, nunca do valor armazenado.
    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      descriptionBottom: cat.descriptionBottom,
      parentId: cat.parentId,
      level: niveisReais.get(cat.id) ?? 0,
      orderIndex: cat.orderIndex ?? 1,
      imageUrl: cat.imageUrl,
      metaTitle: cat.metaTitle,
      metaDescription: cat.metaDescription,
      isActive: cat.isActive,
      productCount: Number(cat.productCount || 0),
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));
  } catch (error) {
    console.error(
      "[categorias:admin:listagem:erro]",
      descreverErroBancoParaLog(error),
    );
    throw new Error(
      erroEhTransitorioDeBanco(error)
        ? "Não foi possível conectar ao banco de dados. Tente novamente em alguns instantes."
        : "Não foi possível carregar as categorias.",
    );
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
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.CATEGORIAS.VISUALIZAR);
  try {
    return await executarLeituraComRetry(
      "categorias:admin:detalhe",
      async () => {
        // 1. Busca a categoria principal
        const mainCategory = await db
          .select({
            id: categoryTable.id,
            name: categoryTable.name,
            slug: categoryTable.slug,
            description: categoryTable.description,
            descriptionBottom: categoryTable.descriptionBottom,
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
          .limit(1);

        if (!mainCategory.length) return null;

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
    `);

        const category = mainCategory[0];

        // Cria um mapa de todos os itens para fácil acesso
        const linhasSubcategorias = Array.isArray(allSubs)
          ? allSubs
          : (allSubs.rows ?? []);
        const itemMap = new Map();
        linhasSubcategorias.forEach((row: any) => {
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
            children: [], // Inicia com array vazio para os filhos
          });
        });

        // Constrói a árvore: para cada item, coloca no children do pai
        const roots: any[] = [];
        itemMap.forEach((item) => {
          if (item.parentId) {
            const parent = itemMap.get(item.parentId);
            if (parent) {
              parent.children.push(item);
            } else {
              // Se não encontrar o pai, considera como raiz (fallback)
              roots.push(item);
            }
          } else {
            roots.push(item);
          }
        });

        return {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          descriptionBottom: category.descriptionBottom,
          parentId: category.parentId,
          level: category.level ?? 0,
          orderIndex: category.orderIndex ?? 1,
          imageUrl: category.imageUrl,
          metaTitle: category.metaTitle,
          metaDescription: category.metaDescription,
          isActive: category.isActive,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
          subcategories: roots, // ← AGORA É UMA ÁRVORE!
        };
      },
    );
  } catch (error) {
    console.error(
      "[categorias:admin:detalhe:erro]",
      descreverErroBancoParaLog(error),
    );
    throw new Error(
      erroEhTransitorioDeBanco(error)
        ? "Não foi possível conectar ao banco de dados. Tente novamente em alguns instantes."
        : "Não foi possível carregar a categoria.",
    );
  }
}

// =====================================================================
// 3. CRIAR NOVA CATEGORIA
// =====================================================================
export async function createCategory(data: CreateCategoryInput) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.CATEGORIAS.ADMINISTRAR);
  try {
    const itens = validarArvoreCategorias(data);
    const newCategory = await dbTransacional.transaction(async (tx) => {
      await validarSlugsUnicosNoBanco(tx, itens);
      let parentId: string | null = null;
      let level = 0;
      if (data.parentId) {
        const [categoriaPai] = await tx
          .select({
            id: categoryTable.id,
            isActive: categoryTable.isActive,
          })
          .from(categoryTable)
          .where(eq(categoryTable.id, data.parentId))
          .limit(1);
        if (!categoriaPai) throw new Error("Categoria pai não encontrada.");
        if (!categoriaPai.isActive)
          throw new Error("A categoria pai está inativa.");

        const hierarquia = await tx
          .select({ id: categoryTable.id, parentId: categoryTable.parentId })
          .from(categoryTable);
        parentId = categoriaPai.id;
        level = (calcularNiveisReais(hierarquia).get(parentId) ?? 0) + 1;
      }
      const [categoria] = await tx
        .insert(categoryTable)
        .values({
          name: data.name.trim(),
          slug: data.slug.trim(),
          description: data.description || null,
          descriptionBottom: data.descriptionBottom || null,
          isActive: data.isActive ?? true,
          metaTitle: data.metaTitle || null,
          metaDescription: data.metaDescription || null,
          orderIndex: data.orderIndex ?? 1,
          level,
          parentId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (data.subcategories?.length) {
        await insertSubcategories(tx, data.subcategories, categoria.id, level);
      }
      return categoria;
    });

    revalidarCategorias();

    return {
      ...newCategory,
      orderIndex: newCategory.orderIndex ?? 1,
    };
  } catch (error) {
    console.error(
      "[categorias:admin:criacao:erro]",
      descreverErroBancoParaLog(error),
    );
    if (erroEhTransitorioDeBanco(error)) {
      throw new Error(
        "Não foi possível conectar ao banco de dados. Nenhuma categoria foi criada. Tente novamente em alguns instantes.",
      );
    }
    throw new Error(
      error instanceof Error ? error.message : "Falha ao criar categoria.",
    );
  }
}

// =====================================================================
// 4. ATUALIZAR CATEGORIA EXISTENTE
// =====================================================================
export async function updateCategory(id: string, data: UpdateCategoryInput) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.CATEGORIAS.ADMINISTRAR);
  try {
    const resultado = await dbTransacional.transaction(async (tx) => {
      const hierarquiaAtual = await tx
        .select({
          id: categoryTable.id,
          name: categoryTable.name,
          slug: categoryTable.slug,
          parentId: categoryTable.parentId,
          isActive: categoryTable.isActive,
        })
        .from(categoryTable);
      const categoriaAtual = hierarquiaAtual.find(
        (categoria) => categoria.id === id,
      );

      if (!categoriaAtual) throw new Error("Categoria não encontrada.");

      const itens = validarArvoreCategorias({
        id,
        name: data.name ?? categoriaAtual.name,
        slug: data.slug ?? categoriaAtual.slug,
        subcategories: data.subcategories,
      });
      await validarSlugsUnicosNoBanco(tx, itens);

      let nivelCategoria = calcularNiveisReais(hierarquiaAtual).get(id) ?? 0;

      if (data.parentId !== undefined) {
        if (data.parentId === id) {
          throw new Error("Uma categoria não pode ser pai dela mesma.");
        }

        const descendentes = obterIdsDescendentes(hierarquiaAtual, id);
        if (data.parentId && descendentes.has(data.parentId)) {
          throw new Error(
            "Uma categoria descendente não pode ser selecionada como pai.",
          );
        }

        if (data.parentId) {
          const categoriaPai = hierarquiaAtual.find(
            (categoria) => categoria.id === data.parentId,
          );
          if (!categoriaPai?.isActive) {
            throw new Error("Selecione uma categoria pai válida e ativa.");
          }
        }

        const hierarquiaPretendida = hierarquiaAtual.map((categoria) =>
          categoria.id === id
            ? { ...categoria, parentId: data.parentId ?? null }
            : categoria,
        );
        nivelCategoria = calcularNiveisReais(hierarquiaPretendida).get(id) ?? 0;
      }

      let existingSubcategories: ExistingSubcategory[] = [];
      let existingById = new Map<string, ExistingSubcategory>();
      let removedSubcategories: ExistingSubcategory[] = [];

      if (data.subcategories) {
        existingSubcategories = await getDescendantCategories(id, tx);
        existingById = new Map(
          existingSubcategories.map((subcategory) => [
            subcategory.id,
            subcategory,
          ]),
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
          tx,
        );

        for (const subcategory of removedSubcategories) {
          const productsCount = productCounts.get(subcategory.id) || 0;

          if (productsCount > 0) {
            console.log("[categorias:admin:exclusao-bloqueada]", {
              nome: subcategory.name,
              produtos: productsCount,
            });
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
        updatedAt: new Date(), // Sempre atualiza a data de modificação
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.slug !== undefined) updateData.slug = data.slug;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.descriptionBottom !== undefined)
        updateData.descriptionBottom = data.descriptionBottom;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
      if (data.metaDescription !== undefined)
        updateData.metaDescription = data.metaDescription;
      if (data.orderIndex !== undefined)
        updateData.orderIndex = data.orderIndex;
      if (data.parentId !== undefined) {
        updateData.parentId = data.parentId;
        updateData.level = nivelCategoria;
      }

      await tx
        .update(categoryTable)
        .set(updateData)
        .where(eq(categoryTable.id, id));

      console.log("[categorias:admin:categoria-atualizada]");

      // =================================================================
      // PASSO 2: Sincroniza subcategorias sem apagar tudo e recriar
      // =================================================================
      if (data.subcategories) {
        const touchedIds = new Set<string>();

        if (data.subcategories.length > 0) {
          await syncSubcategories({
            tx,
            subcategories: data.subcategories,
            parentId: id,
            existingById,
            touchedIds,
            parentLevel: nivelCategoria,
          });
        }

        for (const subcategory of removedSubcategories) {
          await tx
            .delete(categoryTable)
            .where(eq(categoryTable.id, subcategory.id));
          console.log("[categorias:admin:subcategoria-removida]", {
            nome: subcategory.name,
          });
        }
      }

      if (data.parentId !== undefined) {
        const hierarquiaAtualizada = await tx
          .select({ id: categoryTable.id, parentId: categoryTable.parentId })
          .from(categoryTable);
        const niveisAtualizados = calcularNiveisReais(hierarquiaAtualizada);
        const idsParaRecalcular = obterIdsDescendentes(
          hierarquiaAtualizada,
          id,
        );
        idsParaRecalcular.add(id);

        for (const categoriaId of idsParaRecalcular) {
          await tx
            .update(categoryTable)
            .set({
              level: niveisAtualizados.get(categoriaId) ?? 0,
              updatedAt: new Date(),
            })
            .where(eq(categoryTable.id, categoriaId));
        }
      }

      console.log(
        "🟢 [updateCategory] Categoria e subcategorias atualizadas com sucesso!",
      );
      return { success: true };
    });

    revalidarCategorias();
    return resultado;
  } catch (error) {
    console.error(
      "[categorias:admin:atualizacao:erro]",
      descreverErroBancoParaLog(error),
    );
    if (erroEhTransitorioDeBanco(error)) {
      throw new Error(
        "Não foi possível conectar ao banco de dados. Nenhuma alteração foi salva. Tente novamente em alguns instantes.",
      );
    }
    throw new Error(
      error instanceof Error ? error.message : "Falha ao atualizar categoria.",
    );
  }
}

// =====================================================================
// 5. EXCLUIR CATEGORIA (SOFT OU HARD DELETE)
// =====================================================================
export async function deleteCategory(
  id: string,
  type: "soft" | "hard" = "soft",
) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.CATEGORIAS.EXCLUIR);
  try {
    if (type === "hard") {
      const subcategorias = await getDescendantCategories(id);

      if (subcategorias.length > 0) {
        throw new Error(
          "Não é possível excluir permanentemente: a categoria possui subcategorias vinculadas.",
        );
      }

      const contagemProdutos = await getProductCountsByCategoryIds([id]);
      const totalProdutos = Number(contagemProdutos.get(id) || 0);

      if (totalProdutos > 0) {
        throw new Error(
          `Não é possível excluir permanentemente: existem ${totalProdutos} produto(s) vinculado(s) a esta categoria.`,
        );
      }

      await db.delete(categoryTable).where(eq(categoryTable.id, id));
      console.log(
        `🟢 [deleteCategory] Categoria removida em hard delete: ${id}`,
      );
    } else {
      await db
        .update(categoryTable)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(categoryTable.id, id));
      console.log(
        `🟢 [deleteCategory] Categoria marcada como inativa (soft delete): ${id}`,
      );
    }
    return { success: true };
  } catch (error) {
    console.error("❌ [deleteCategory] Erro:", error);
    throw new Error(
      error instanceof Error ? error.message : "Falha ao excluir categoria",
    );
  }
}

// =====================================================================
// 6. RESTAURAR CATEGORIA INATIVA
// =====================================================================
export async function restoreCategory(id: string) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.CATEGORIAS.ADMINISTRAR);
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
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.CATEGORIAS.VISUALIZAR);
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

export async function getProdutosVinculadosDaCategoria(categoryId: string) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.CATEGORIAS.VISUALIZAR);
  try {
    const produtos = await db
      .select({
        id: productTable.id,
        sku: productTable.sku,
        nome: productTable.name,
      })
      .from(productTable)
      .where(eq(productTable.categoryId, categoryId))
      .orderBy(asc(productTable.name))
      .limit(200);

    return produtos.map((produto) => ({
      id: produto.id,
      sku: produto.sku,
      nome: produto.nome,
    }));
  } catch (error) {
    console.error("❌ [getProdutosVinculadosDaCategoria] Erro:", error);
    throw new Error("Falha ao buscar produtos vinculados da categoria");
  }
}
