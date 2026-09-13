/**
 * ÍNDICE DE TABELAS DE SHIPPING
 *
 * Exporta todas as tabelas e tipos do módulo de entrega própria
 */

export {
  type AgendaGeograficaEntregaPropria,
  agendasGeograficasEntregaPropria,
  agendasGeograficasEntregaPropriaRelations,
  datasBloqueadasAgendaEntregaPropria,
  datasBloqueadasAgendaEntregaPropriaRelations,
} from "./agendasGeograficasEntregaPropria";
export {
  type BairroEntregaPropria,
  bairrosEntregaPropria,
  bairrosEntregaPropriaRelations,
  type NovoBairroEntregaPropria,
} from "./bairrosEntregaPropria";
export {
  type NewProductOwnDeliveryPrice,
  type ProductOwnDeliveryPrice,
  productOwnDeliveryPrices,
  productOwnDeliveryPricesRelations,
} from "./productOwnDeliveryPrices";
export {
  type BairroAvulso,
  bairrosAvulsos,
  bairrosAvulsosRelations,
  type CepEspecifico,
  cepsEspecificos,
  type NewBairroAvulso,
  type NewCepEspecifico,
  type NewRegioBairro,
  type NewShippingBairroAvulsoSlot,
  type NewShippingPendingNeighborhood,
  type NewShippingRegion,
  type NewShippingRegionCepRange,
  type NewShippingRegionSlot,
  type RegioBairro,
  regioBairros,
  regioBairrosRelations,
  type ShippingBairroAvulsoSlot,
  shippingBairroAvulsoSlots,
  shippingBairroAvulsoSlotsRelations,
  type ShippingPendingNeighborhood,
  shippingPendingNeighborhoods,
  // Tipos
  type ShippingRegion,
  type ShippingRegionCepRange,
  shippingRegionCepRanges,
  shippingRegionCepRangesRelations,
  shippingRegions,
  type ShippingRegionSlot,
  shippingRegionSlots,
  shippingRegionSlotsRelations,
  // Relações
  shippingRegionsRelations,
} from "./shippingRegions";
export {
  type NewShippingZipAddress,
  type ShippingZipAddress,
  shippingZipAddresses,
  shippingZipAddressesRelations,
} from "./shippingZipAddresses";
