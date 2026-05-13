import { OPCOES_FRETE_CHECKOUT } from "../constants/checkout-steps";
import type { OpcaoFreteCheckoutId } from "../types/checkout.types";

export function calcularFreteCheckout(freteId: OpcaoFreteCheckoutId) {
  const frete = OPCOES_FRETE_CHECKOUT.find((opcao) => opcao.id === freteId);

  return frete ?? OPCOES_FRETE_CHECKOUT[0];
}
