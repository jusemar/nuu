import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  fornecedorIntegracoesApiTable,
  fornecedorProdutoVinculosTable,
} from "@/db/schema";
import { obterAmbienteAplicacaoLaquila } from "@/features/fornecedores/integracoes/laquila/lib/ambiente-laquila";

/**
 * Resolve em uma unica leitura os provedores associados aos vinculos ativos.
 * A situacao operacional da API nao muda a origem fisica de um produto.
 */
export async function listarProvedoresExpedicaoProdutos(
  produtosIds: readonly string[],
) {
  const produtosUnicosIds = [...new Set(produtosIds)];
  const ambiente = obterAmbienteAplicacaoLaquila();

  if (produtosUnicosIds.length === 0) {
    return new Map<string, string>();
  }

  const vinculos = await db
    .select({
      produtoId: fornecedorProdutoVinculosTable.produtoId,
      provedor: fornecedorIntegracoesApiTable.provedor,
    })
    .from(fornecedorProdutoVinculosTable)
    .innerJoin(
      fornecedorIntegracoesApiTable,
      eq(
        fornecedorIntegracoesApiTable.fornecedorId,
        fornecedorProdutoVinculosTable.fornecedorId,
      ),
    )
    .where(
      and(
        inArray(fornecedorProdutoVinculosTable.produtoId, produtosUnicosIds),
        eq(fornecedorProdutoVinculosTable.status, "ativo"),
        eq(fornecedorIntegracoesApiTable.ambiente, ambiente),
      ),
    );

  const provedoresPorProdutoId = new Map<string, string>();

  for (const vinculo of vinculos) {
    const provedorExistente = provedoresPorProdutoId.get(vinculo.produtoId);

    if (provedorExistente && provedorExistente !== vinculo.provedor) {
      throw new Error(
        `Produto ${vinculo.produtoId} possui mais de um provedor de expedicao ativo.`,
      );
    }

    provedoresPorProdutoId.set(vinculo.produtoId, vinculo.provedor);
  }

  return provedoresPorProdutoId;
}
