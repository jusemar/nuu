import type { ItemCarrinho, TotaisCarrinho } from "../types/carrinho.types";

export function calcularTotaisCarrinho(itens: ItemCarrinho[]): TotaisCarrinho {
  return itens.reduce<TotaisCarrinho>(
    (totais, item) => ({
      quantidadeTotal: totais.quantidadeTotal + item.quantidade,
      subtotalEmCentavos:
        totais.subtotalEmCentavos + item.precoEmCentavos * item.quantidade,
    }),
    {
      quantidadeTotal: 0,
      subtotalEmCentavos: 0,
    },
  );
}
