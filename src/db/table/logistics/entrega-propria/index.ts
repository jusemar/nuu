/**
 * ÍNDICE DE TABELAS DE SHIPPING
 * 
 * Exporta todas as tabelas e tipos do módulo de entrega própria
 */

export {
  shippingRegions,
  regioBairros,
  bairrosAvulsos,
  cepsEspecificos,
  shippingRegionSlots,
  shippingBairroAvulsoSlots,
  // Relações
  shippingRegionsRelations,
  regioBairrosRelations,
  bairrosAvulsosRelations,
  shippingRegionSlotsRelations,
  shippingBairroAvulsoSlotsRelations,
  // Tipos
  type ShippingRegion,
  type NewShippingRegion,
  type RegioBairro,
  type NewRegioBairro,
  type BairroAvulso,
  type NewBairroAvulso,
  type CepEspecifico,
  type NewCepEspecifico,
  type ShippingRegionSlot,
  type NewShippingRegionSlot,
  type ShippingBairroAvulsoSlot,
  type NewShippingBairroAvulsoSlot,
} from './shippingRegions';
