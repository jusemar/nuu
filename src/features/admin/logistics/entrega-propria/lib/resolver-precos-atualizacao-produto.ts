import type { ModoDisponibilidadeEntregaPropria } from "@/db/table/logistics/entrega-propria/modo-disponibilidade-entrega-propria";

import type { ProductOwnDeliveryPriceFormItem } from "../types/shipping";

/** Ausência de preços no formulário significa que eles não foram editados. */
export function resolverPrecosAtualizacaoProduto(
  precosRecebidos: ProductOwnDeliveryPriceFormItem[] | undefined,
  modoEntregaPropria: ModoDisponibilidadeEntregaPropria,
  usaLogisticaLaquila: boolean,
): ProductOwnDeliveryPriceFormItem[] | undefined {
  // Desativar a modalidade ou usar Laquila remove os preços de propósito.
  if (usaLogisticaLaquila || modoEntregaPropria === "desativado") return [];
  return precosRecebidos;
}
