import type { ItemCarrinho } from "@/features/carrinho";

import { CUPONS_CHECKOUT } from "../constants/checkout-steps";
import type { TotaisCheckout } from "../types/checkout.types";

type CalcularTotalCheckoutParams = {
  itens: Pick<ItemCarrinho, "precoEmCentavos" | "quantidade">[];
  freteEmCentavos: number;
  cupom?: string;
};

export function calcularTotalCheckout({
  itens,
  freteEmCentavos,
  cupom,
}: CalcularTotalCheckoutParams): TotaisCheckout {
  const subtotalEmCentavos = itens.reduce(
    (total, item) => total + item.precoEmCentavos * item.quantidade,
    0,
  );

  const cupomNormalizado = cupom?.trim().toUpperCase();
  const regraCupom = cupomNormalizado
    ? CUPONS_CHECKOUT[cupomNormalizado as keyof typeof CUPONS_CHECKOUT]
    : null;

  const descontoProdutosEmCentavos = regraCupom?.percentual
    ? Math.round(subtotalEmCentavos * (regraCupom.percentual / 100))
    : 0;

  const descontoFreteEmCentavos = regraCupom?.freteGratis ? freteEmCentavos : 0;

  const descontoEmCentavos =
    descontoProdutosEmCentavos + descontoFreteEmCentavos;

  return {
    subtotalEmCentavos,
    freteEmCentavos,
    descontoEmCentavos,
    totalEmCentavos: Math.max(
      subtotalEmCentavos + freteEmCentavos - descontoEmCentavos,
      0,
    ),
  };
}
