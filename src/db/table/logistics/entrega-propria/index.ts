/**
 * ÍNDICE DE TABELAS DE SHIPPING
 *
 * Exporta todas as tabelas e tipos do módulo de entrega própria
 */

export {
  shippingRegions,
  regioBairros,
  shippingRegionCepRanges,
  bairrosAvulsos,
  cepsEspecificos,
  shippingRegionSlots,
  shippingBairroAvulsoSlots,
  shippingPendingNeighborhoods,
  // Relações
  shippingRegionsRelations,
  regioBairrosRelations,
  shippingRegionCepRangesRelations,
  bairrosAvulsosRelations,
  shippingRegionSlotsRelations,
  shippingBairroAvulsoSlotsRelations,
  // Tipos
  type ShippingRegion,
  type NewShippingRegion,
  type RegioBairro,
  type NewRegioBairro,
  type ShippingRegionCepRange,
  type NewShippingRegionCepRange,
  type BairroAvulso,
  type NewBairroAvulso,
  type CepEspecifico,
  type NewCepEspecifico,
  type ShippingRegionSlot,
  type NewShippingRegionSlot,
  type ShippingBairroAvulsoSlot,
  type NewShippingBairroAvulsoSlot,
  type ShippingPendingNeighborhood,
  type NewShippingPendingNeighborhood,
} from "./shippingRegions";

export {
  shippingZipAddresses,
  shippingZipAddressesRelations,
  type ShippingZipAddress,
  type NewShippingZipAddress,
} from "./shippingZipAddresses";

export {
  productOwnDeliveryPrices,
  productOwnDeliveryPricesRelations,
  type ProductOwnDeliveryPrice,
  type NewProductOwnDeliveryPrice,
} from "./productOwnDeliveryPrices";
