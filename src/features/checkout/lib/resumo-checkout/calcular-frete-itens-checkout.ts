import type { ItemCarrinho } from "@/features/carrinho";

export function resolverFreteItemCheckout(item: ItemCarrinho) {
  if (!item.freteEscolhido) {
    throw new Error("Selecione uma forma de entrega para continuar.");
  }

  return item.freteEscolhido;
}

export function calcularFreteItensCheckout({
  itens,
}: {
  itens: ItemCarrinho[];
}) {
  return itens.reduce((total, item) => {
    const frete = resolverFreteItemCheckout(item);

    return total + frete.valorEmCentavos;
  }, 0);
}
