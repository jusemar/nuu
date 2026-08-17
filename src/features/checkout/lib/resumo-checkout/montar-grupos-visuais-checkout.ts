import type {
  ItemResumoCheckout,
  ResumoCheckoutCalculado,
} from "../../types/checkout.types";

export type GrupoVisualCheckout = {
  chave: string;
  titulo: string | null;
  descricao: string | null;
  itens: ItemResumoCheckout[];
};

/**
 * Traduz os grupos internos para linguagem publica. O nome do provedor nunca
 * atravessa este contrato visual, inclusive quando houver novos fornecedores.
 */
export function montarGruposVisuaisCheckout(
  gruposLogisticos: ResumoCheckoutCalculado["gruposLogisticos"],
): GrupoVisualCheckout[] {
  const possuiMultiplasEntregas = gruposLogisticos.length > 1;

  return gruposLogisticos.map((grupo) => ({
    chave: grupo.chave,
    titulo: possuiMultiplasEntregas
      ? grupo.origemExpedicao === "loja"
        ? "Envio de BH/MG"
        : "Envio do PR"
      : null,
    descricao:
      !possuiMultiplasEntregas && grupo.origemExpedicao === "fornecedor"
        ? "Produtos enviados separadamente"
        : null,
    itens: grupo.itens,
  }));
}
