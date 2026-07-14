import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { categoryTable, marcaTable, productTable } from "@/db/schema";

import type { ResultadoAlteracaoEmMassa } from "../../types/alteracao-em-massa.types";

const DADOS_VAZIOS = { produtos: [], categorias: [], marcas: [] };

/**
 * Carrega somente os dados necessários para a primeira fase da tela.
 * Não executa escrita e não reutiliza actions de atualização de produtos.
 */
export async function listarDadosAlteracaoEmMassa(): Promise<ResultadoAlteracaoEmMassa> {
  try {
    const [produtos, categorias, marcas] = await Promise.all([
      db
        .select({
          id: productTable.id,
          nome: productTable.name,
          sku: productTable.sku,
          ativo: productTable.isActive,
          categoriaId: productTable.categoryId,
          categoriaNome: categoryTable.name,
          marcaId: productTable.marcaId,
          marcaNome: marcaTable.nome,
          secoesLoja: productTable.storeProductFlags,
          tipoProduto: productTable.productKind,
          atualizadoEm: productTable.updatedAt,
        })
        .from(productTable)
        .innerJoin(categoryTable, eq(productTable.categoryId, categoryTable.id))
        .innerJoin(marcaTable, eq(productTable.marcaId, marcaTable.id))
        .orderBy(asc(productTable.name)),
      db
        .select({
          id: categoryTable.id,
          nome: categoryTable.name,
          parentId: categoryTable.parentId,
          nivel: categoryTable.level,
          ordem: categoryTable.orderIndex,
          ativa: categoryTable.isActive,
        })
        .from(categoryTable)
        .orderBy(
          asc(categoryTable.level),
          asc(categoryTable.orderIndex),
          asc(categoryTable.name),
        ),
      db
        .select({
          id: marcaTable.id,
          nome: marcaTable.nome,
          ativa: marcaTable.ativo,
        })
        .from(marcaTable)
        .orderBy(asc(marcaTable.nome)),
    ]);

    return {
      sucesso: true,
      dados: {
        produtos: produtos.map((produto) => ({
          ...produto,
          ativo: produto.ativo ?? false,
          secoesLoja: produto.secoesLoja ?? [],
        })),
        categorias: categorias.map((categoria) => ({
          ...categoria,
          ordem: categoria.ordem ?? 0,
        })),
        marcas,
      },
    };
  } catch (erro) {
    console.error("[produtos:alteracao-em-massa:listagem]", {
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
    });

    return {
      sucesso: false,
      erro: "Não foi possível carregar os produtos para alteração em massa.",
      dados: DADOS_VAZIOS,
    };
  }
}
