import type { ModalidadePrecoProduto } from "../types/alteracao-em-massa.types";

export const MODALIDADES_PRECO_PRODUTO: ReadonlyArray<{
  id: ModalidadePrecoProduto;
  rotulo: string;
}> = [
  { id: "stock", rotulo: "Estoque Próprio" },
  { id: "preSale", rotulo: "Pré-venda" },
  { id: "dropshipping", rotulo: "Dropshipping" },
  { id: "orderBasis", rotulo: "Sob encomenda" },
];

export function normalizarModalidadePreco(
  modalidade: string,
): ModalidadePrecoProduto | null {
  if (modalidade === "stock") return "stock";
  if (modalidade === "preSale" || modalidade === "pre_sale") return "preSale";
  if (modalidade === "dropshipping") return "dropshipping";
  if (modalidade === "orderBasis" || modalidade === "order_basis") {
    return "orderBasis";
  }
  return null;
}

export function obterRotuloModalidadePreco(modalidade: ModalidadePrecoProduto) {
  return (
    MODALIDADES_PRECO_PRODUTO.find((item) => item.id === modalidade)?.rotulo ??
    modalidade
  );
}
