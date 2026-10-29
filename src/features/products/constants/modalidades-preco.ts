import { normalizarModalidadePrecoCanonica } from "@/features/precificacao/client";
import { ROTULO_MODALIDADE_FORNECEDOR } from "@/features/precificacao/constants/rotulo-fornecedor";

import type { ModalidadePrecoProduto } from "../types/alteracao-em-massa.types";

export const MODALIDADES_PRECO_PRODUTO: ReadonlyArray<{
  id: ModalidadePrecoProduto;
  rotulo: string;
}> = [
  { id: "stock", rotulo: "Estoque Próprio" },
  { id: "preSale", rotulo: "Pré-venda" },
  { id: "dropshipping", rotulo: ROTULO_MODALIDADE_FORNECEDOR },
  { id: "orderBasis", rotulo: "Sob encomenda" },
];

export function normalizarModalidadePreco(
  modalidade: string,
): ModalidadePrecoProduto | null {
  const modalidadeCanonica = normalizarModalidadePrecoCanonica(modalidade);
  if (modalidadeCanonica === "pre_sale") return "preSale";
  if (modalidadeCanonica === "order_basis") return "orderBasis";
  return modalidadeCanonica;
}

export function obterRotuloModalidadePreco(modalidade: ModalidadePrecoProduto) {
  return (
    MODALIDADES_PRECO_PRODUTO.find((item) => item.id === modalidade)?.rotulo ??
    modalidade
  );
}
