import "server-only";

import { eq, inArray } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  configuracoesProgramaFidelidadeTable,
  regrasCategoriasProgramaFidelidadeTable,
} from "@/db/schema";

import {
  type ProdutoParaPontuacaoVitrine,
  resolverPontosVitrineProdutos,
} from "../lib/calcular-pontos-vitrine";

/**
 * Resolve toda uma coleção com, no máximo, duas consultas: uma configuração
 * global e todas as regras específicas das categorias envolvidas.
 */
export async function calcularPontosVitrineProdutos(
  produtos: ProdutoParaPontuacaoVitrine[],
): Promise<Record<string, string>> {
  if (produtos.length === 0) return {};

  const categoriasIds = [
    ...new Set(produtos.map((produto) => produto.categoriaId)),
  ];
  const [configuracoes, regras] = await Promise.all([
    db
      .select({
        ativo: configuracoesProgramaFidelidadeTable.ativo,
        pontosPorReal: configuracoesProgramaFidelidadeTable.pontosPorReal,
      })
      .from(configuracoesProgramaFidelidadeTable)
      .where(eq(configuracoesProgramaFidelidadeTable.id, "global"))
      .limit(1),
    db
      .select({
        categoriaId: regrasCategoriasProgramaFidelidadeTable.categoriaId,
        ativa: regrasCategoriasProgramaFidelidadeTable.ativa,
        pontosPorReal: regrasCategoriasProgramaFidelidadeTable.pontosPorReal,
      })
      .from(regrasCategoriasProgramaFidelidadeTable)
      .where(
        inArray(
          regrasCategoriasProgramaFidelidadeTable.categoriaId,
          categoriasIds,
        ),
      ),
  ]);

  return resolverPontosVitrineProdutos({
    produtos,
    configuracao: configuracoes[0] ?? null,
    regrasCategorias: regras,
  });
}
