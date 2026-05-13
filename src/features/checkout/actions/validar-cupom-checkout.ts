"use server";

import { CUPONS_CHECKOUT } from "../constants/checkout-steps";
import { validarCupomCheckoutSchema } from "../schemas/checkout.schema";

export async function validarCupomCheckout(data: unknown) {
  const { cupom } = validarCupomCheckoutSchema.parse(data);
  const cupomNormalizado = cupom.trim().toUpperCase();
  const regraCupom =
    CUPONS_CHECKOUT[cupomNormalizado as keyof typeof CUPONS_CHECKOUT];

  if (!regraCupom) {
    return {
      valido: false,
      mensagem: "Cupom inválido",
    };
  }

  return {
    valido: true,
    mensagem: regraCupom.freteGratis
      ? "Frete grátis aplicado"
      : `${regraCupom.percentual}% de desconto aplicado`,
  };
}
