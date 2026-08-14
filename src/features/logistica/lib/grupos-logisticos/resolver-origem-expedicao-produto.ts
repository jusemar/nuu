import type { ContextoOrigemExpedicao } from "../../types/grupos-logisticos";

type EntradaResolverOrigemExpedicaoProduto = {
  /**
   * Provedor obtido por uma consulta segura de vinculo ativo. Para a Laquila,
   * a fonte atual e verificarLogisticaLaquilaProduto.
   */
  fornecedorProvedorAtivo: string | null;
};

export function resolverOrigemExpedicaoProduto({
  fornecedorProvedorAtivo,
}: EntradaResolverOrigemExpedicaoProduto): ContextoOrigemExpedicao {
  const provedorNormalizado =
    fornecedorProvedorAtivo?.trim().toLowerCase() || null;

  if (!provedorNormalizado) {
    return {
      origemExpedicao: "loja",
      fornecedorProvedor: null,
      necessitaEtiquetaFornecedor: false,
    };
  }

  return {
    origemExpedicao: "fornecedor",
    fornecedorProvedor: provedorNormalizado,
    necessitaEtiquetaFornecedor: provedorNormalizado === "laquila",
  };
}
