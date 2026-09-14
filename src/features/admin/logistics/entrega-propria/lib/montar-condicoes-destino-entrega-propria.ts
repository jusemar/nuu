import type { ProductOwnDeliveryPriceFormItem } from "../types/shipping";

/**
 * Converte um item do formulário "Preços de Entrega Própria por destino" nas
 * colunas persistidas. Produto e Categoria gravam exatamente o mesmo formato,
 * então a regra mora aqui e é reutilizada pelas duas actions.
 */
export function montarCondicoesDestinoEntregaPropria(
  item: ProductOwnDeliveryPriceFormItem,
) {
  return {
    destinationType: item.destinationType,
    regionId: item.destinationType === "region" ? item.destinationId : null,
    bairroId: item.destinationType === "bairro" ? item.destinationId : null,
    cepEspecificoId:
      item.destinationType === "cep-especifico" ? item.destinationId : null,
    cityId: item.destinationType === "cidade" ? item.destinationId : null,
    shippingPrice: item.shippingPrice,
    rapidDeliveryActive: item.rapidDeliveryActive ?? true,
    deliveryDeadline: item.deliveryDeadline?.trim() || null,
    scheduledDeliveryActive: item.scheduledDeliveryActive ?? false,
    // Janelas = próximas datas válidas da Agenda Geográfica após a rápida.
    scheduledDeliveryMinDays: item.scheduledDeliveryActive
      ? Math.max(0, Math.trunc(item.scheduledDeliveryMinDays ?? 0))
      : null,
    // 0 é um valor válido: programada grátis.
    scheduledDeliveryPrice: item.scheduledDeliveryActive
      ? Math.max(0, item.scheduledDeliveryPrice ?? 0)
      : null,
    isActive: item.isActive ?? true,
  };
}
