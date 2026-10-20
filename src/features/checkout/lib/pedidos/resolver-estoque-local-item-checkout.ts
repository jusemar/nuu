import type { ItemCarrinho } from "@/features/carrinho";
import { modalidadePrecoExigeEstoqueLocal } from "@/features/precificacao/lib/normalizar-modalidade-preco";

import { resolverItemVendavelCheckout } from "./normalizar-checkout-visitante";

type ProdutoCheckout = Parameters<typeof resolverItemVendavelCheckout>[0]["produto"];

/** A mesma seleção de modalidade do checkout decide se a variante usa estoque local. */
export function resolverEstoqueLocalItemCheckout({
  item,
  produto,
}: {
  item: ItemCarrinho;
  produto: ProdutoCheckout;
}): string | null {
  const vendavel = resolverItemVendavelCheckout({ item, produto });
  const modalidade = vendavel.tipo === "simple"
    ? vendavel.precoSelecionado.type
    : vendavel.precoSelecionado?.type;
  const exigeEstoque = modalidadePrecoExigeEstoqueLocal(modalidade) ||
    (vendavel.tipo === "variant" && item.modalidadeTipo?.startsWith("variant:"));
  if (!exigeEstoque) return null;
  return vendavel.tipo === "simple" ? vendavel.varianteTecnica.id : vendavel.variante.id;
}
