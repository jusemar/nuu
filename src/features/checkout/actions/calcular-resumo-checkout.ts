"use server";

import {
  calcularResumoCheckout,
  type CalcularResumoCheckoutParams,
} from "../queries/resumo-checkout/calcular-resumo-checkout";

type EntradaPublicaResumoCheckout = Omit<
  CalcularResumoCheckoutParams,
  "incluirDadosAuditoriaFrete"
>;

/**
 * Fronteira pública do resumo. Os metadados de auditoria ficam exclusivamente no servidor
 * e só são solicitados pela criação transacional do pedido.
 */
export async function calcularResumoCheckoutAction(
  entrada: EntradaPublicaResumoCheckout,
) {
  return calcularResumoCheckout(entrada);
}

