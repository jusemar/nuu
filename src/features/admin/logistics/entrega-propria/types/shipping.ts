/**
 * TIPOS - Shipping Module
 *
 * ⚠️ FUNCIONALIDADE VÁLIDA APENAS PARA ENTREGA PRÓPRIA
 */

import type {
  BairroAvulso as BairroAvulsoRegistro,
  CepEspecifico,
  RegioBairro,
  ShippingBairroAvulsoSlot,
  ShippingRegion as ShippingRegionRegistro,
  ShippingRegionSlot,
} from "@/db/table/logistics/entrega-propria";

export type {
  CepEspecifico,
  RegioBairro,
  ShippingBairroAvulsoSlot,
  ShippingRegionSlot,
};

/** Registros usados pela interface já carregados com suas relações. */
export type ShippingRegion = ShippingRegionRegistro & {
  bairros: RegioBairro[];
  slots: Array<ShippingRegionSlot & { dayName: string }>;
};

export type BairroAvulso = BairroAvulsoRegistro & {
  slots: ShippingBairroAvulsoSlot[];
};

export type RegioFieldState =
  | "idle"
  | "loading"
  | "suggested"
  | "confirmed"
  | "manual"
  | "error";

export type CreateRegionData = {
  name: string;
  description?: string;
  city: string;
  state: string;
  baseShippingPrice: number;
  bairros: string[];
  slots: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
};

export type CreateBairroAvulsoData = {
  neighborhood: string;
  city: string;
  state: string;
  baseShippingPrice: number;
  slots: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
};

export type CreateCepEspecificoData = {
  cep: string;
  neighborhood: string;
  city: string;
  state: string;
  shippingPrice: number;
};

export type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
  erro?: boolean;
};

export type ShippingTab =
  | "regioes"
  | "bairros-avulsos"
  | "ceps-especificos"
  | "teste";

export type OwnDeliveryDestinationType =
  | "region"
  | "bairro-avulso"
  | "cep-especifico"
  | "cidade";

export type ProductOwnDeliveryPriceFormItem = {
  destinationType: OwnDeliveryDestinationType;
  destinationId: number;
  shippingPrice: number;
  deliveryDeadline?: string | null;
  scheduledDeliveryActive?: boolean;
  scheduledDeliveryMinDays?: number | null;
  scheduledDeliveryPrice?: number | null;
  isActive?: boolean;
};
