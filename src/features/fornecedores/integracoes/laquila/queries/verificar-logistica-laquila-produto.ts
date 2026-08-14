import "server-only";

import { listarProvedoresExpedicaoProdutos } from "@/features/fornecedores/queries/listar-provedores-expedicao-produtos";

import { PROVEDOR_INTEGRACAO_LAQUILA } from "../constants";

/**
 * Identifica a origem logística pelo vínculo já existente com o fornecedor.
 * A integração pode estar temporariamente inativa sem mudar a origem do produto;
 * por isso, a regra exige apenas que o vínculo do produto esteja ativo.
 */
export async function verificarLogisticaLaquilaProduto(produtoId: string) {
  const provedoresPorProdutoId = await listarProvedoresExpedicaoProdutos([
    produtoId,
  ]);

  return provedoresPorProdutoId.get(produtoId) === PROVEDOR_INTEGRACAO_LAQUILA;
}
