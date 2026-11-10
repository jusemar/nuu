import type { productOwnDeliveryPrices } from "@/db/table/logistics/entrega-propria/productOwnDeliveryPrices";

import type { ProductOwnDeliveryPriceFormItem } from "../types/shipping";
import { montarCondicoesDestinoEntregaPropria } from "./montar-condicoes-destino-entrega-propria";

type PrecoPersistido = typeof productOwnDeliveryPrices.$inferSelect;

function normalizarPrecoAtual(preco: PrecoPersistido) {
  const destinationId =
    preco.destinationType === "region"
      ? preco.regionId
      : preco.destinationType === "bairro"
        ? preco.bairroId
        : preco.destinationType === "cidade"
          ? preco.cityId
          : preco.cepEspecificoId;

  // Usa a mesma normalização da escrita para comparar só os dados comerciais.
  return montarCondicoesDestinoEntregaPropria({
    destinationType: preco.destinationType,
    destinationId: destinationId ?? 0,
    shippingPrice: preco.shippingPrice,
    rapidDeliveryActive: preco.rapidDeliveryActive,
    deliveryDeadline: preco.deliveryDeadline,
    scheduledDeliveryActive: preco.scheduledDeliveryActive,
    scheduledDeliveryMinDays: preco.scheduledDeliveryMinDays,
    scheduledDeliveryPrice: preco.scheduledDeliveryPrice,
    isActive: preco.isActive,
  });
}

export function precosEntregaPropriaAlterados(
  atuais: PrecoPersistido[],
  recebidos: ProductOwnDeliveryPriceFormItem[],
): boolean {
  // Compare também linhas legadas inválidas: reenviá-las sem edição não pode
  // apagá-las por causa do filtro aplicado apenas no momento da escrita.
  if (atuais.length !== recebidos.length) return true;

  const ordenar = (
    itens: ReturnType<typeof montarCondicoesDestinoEntregaPropria>[],
  ) => itens.map((item) => JSON.stringify(item)).sort();
  return (
    JSON.stringify(ordenar(atuais.map(normalizarPrecoAtual))) !==
    JSON.stringify(ordenar(recebidos.map(montarCondicoesDestinoEntregaPropria)))
  );
}
