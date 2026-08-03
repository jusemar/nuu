// src/features/store/menu/services/menuService.ts
"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { categoryTable } from "@/db/table/categories/categories";

// =====================================================================
// TIPO: MenuCategory
// =====================================================================
// Representa uma categoria no menu da loja
// - id: identificador único
// - name: nome para exibição
// - slug: usado na URL (ex: /category/colchoes)
// - level: nível na hierarquia (0 = raiz, 1 = filha, 2 = neta)
// - parentId: ID da categoria pai (null se for raiz)
// - children: array com as subcategorias (opcional)
// =====================================================================
export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  level: number;
  parentId: string | null;
  children?: MenuCategory[];
}

// =====================================================================
// FUNÇÃO: getActiveCategories
// =====================================================================
// Busca todas as categorias ativas e organiza em árvore para o menu
//
// REGRAS DE NEGÓCIO DO MENU:
// 1. Só mostra categorias ativas (isActive = true).
// 2. Preserva todos os níveis existentes da árvore.
// 3. Qualquer categoria pode ser acessada e, quando possuir filhas, expandida.
// =====================================================================
export async function getActiveCategories(): Promise<MenuCategory[]> {
  try {
    // =================================================================
    // PASSO 1: Buscar todas as categorias ativas do banco de dados
    // =================================================================
    // - Só busca categorias com isActive = true
    // - Ordena por nível e depois por ordem definida no admin
    // =================================================================
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
      .orderBy(categoryTable.level, categoryTable.orderIndex);

    // =================================================================
    // PASSO 2: Criar um mapa para facilitar a montagem da árvore
    // =================================================================
    // O Map permite acessar qualquer categoria pelo seu ID rapidamente
    // Inicializamos todas com um array children vazio
    // =================================================================
    const map = new Map<string, MenuCategory>();
    categories.forEach((cat) => {
      map.set(cat.id, {
        ...cat,
        children: [], // Todo mundo começa com array vazio
      });
    });

    // =================================================================
    // PASSO 3: Montar a árvore seguindo as regras de negócio
    // =================================================================
    // Para cada categoria, verificamos:
    // - Se tem parentId → é filha, tenta adicionar ao pai
    // - Se não tem parentId → é raiz, vai para o array roots
    //
    // Todos os níveis são ligados ao respectivo pai para preservar a árvore.
    // =================================================================
    const roots: MenuCategory[] = [];

    map.forEach((node) => {
      if (node.parentId) {
        // É uma categoria filha (tem pai)
        const parent = map.get(node.parentId);

        if (parent) {
          parent.children!.push(node);
        } else {
          // Caso raro: pai não encontrado (consistência do banco)
          // Trata como raiz para não perder a categoria
          roots.push(node);
        }
      } else {
        // É categoria raiz (nível 0)
        roots.push(node);
      }
    });

    // =================================================================
    // PASSO 4: Retornar a árvore pronta para o componente
    // =================================================================
    // O resultado final tem:
    // - categorias raiz no primeiro nível;
    // - descendentes aninhados sem limite fixo de profundidade.
    // =================================================================
    return roots;
  } catch (error) {
    // Em caso de erro, loga e retorna array vazio
    // O componente vai mostrar mensagem de erro amigável
    console.error("Erro ao buscar categorias para o menu:", error);
    return [];
  }
}
