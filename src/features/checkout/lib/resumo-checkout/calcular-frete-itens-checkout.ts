import type { ItemCarrinho } from "@/features/carrinho";

import { calcularFreteCheckout } from "../calcular-frete-checkout";
import type { OpcaoFreteCheckoutId } from "../../types/checkout.types";

export function resolverFreteItemCheckout({
  item,
  freteFallbackId,
}: {
  item: ItemCarrinho;
  freteFallbackId: OpcaoFreteCheckoutId;
}) {
  if (item.freteEscolhido) {
    return item.freteEscolhido;
  }

  const freteFallback = calcularFreteCheckout(freteFallbackId);

  return {
    id: freteFallback.id,
    nome: freteFallback.nome,
    prazo: freteFallback.prazo,
    valorEmCentavos: freteFallback.valorEmCentavos,
  };
}

export function calcularFreteItensCheckout({
  itens,
  freteFallbackId,
}: {
  itens: ItemCarrinho[];
  freteFallbackId: OpcaoFreteCheckoutId;
}) {
  return itens.reduce((total, item) => {
    const frete = resolverFreteItemCheckout({ item, freteFallbackId });

    return total + frete.valorEmCentavos;
  }, 0);
}
