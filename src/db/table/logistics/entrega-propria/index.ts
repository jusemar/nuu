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
  type CategoryOwnDeliveryPrice,
  categoryOwnDeliveryPrices,
  categoryOwnDeliveryPricesRelations,
  type NewCategoryOwnDeliveryPrice,
} from "./categoryOwnDeliveryPrices";
export {
  type ModoDisponibilidadeEntregaPropria,
  modoDisponibilidadeEntregaPropriaEnum,
} from "./modo-disponibilidade-entrega-propria";
export {
  type NewProductOwnDeliveryPrice,
  type ProductOwnDeliveryPrice,
  productOwnDeliveryPrices,
  productOwnDeliveryPricesRelations,
} from "./productOwnDeliveryPrices";
export {
  type CepEspecifico,
  cepsEspecificos,
  type NewCepEspecifico,
  type NewShippingPendingNeighborhood,
  type NewShippingRegion,
  type NewShippingRegionCepRange,
  type ShippingPendingNeighborhood,
  shippingPendingNeighborhoods,
  // Tipos
  type ShippingRegion,
  type ShippingRegionCepRange,
  shippingRegionCepRanges,
  shippingRegionCepRangesRelations,
  shippingRegions,
  // Relações
  shippingRegionsRelations,
} from "./shippingRegions";
export {
  type NewShippingZipAddress,
  type ShippingZipAddress,
  shippingZipAddresses,
  shippingZipAddressesRelations,
} from "./shippingZipAddresses";
