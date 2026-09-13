/**
 * TIPOS - Shipping Module
 *
 * ⚠️ FUNCIONALIDADE VÁLIDA APENAS PARA ENTREGA PRÓPRIA
 */

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

export type OwnDeliveryDestinationType =
  | "region"
  | "bairro"
  | "cep-especifico"
  | "cidade";

export type ProductOwnDeliveryPriceFormItem = {
  destinationType: OwnDeliveryDestinationType;
  destinationId: number;
  shippingPrice: number;
  rapidDeliveryActive?: boolean;
  deliveryDeadline?: string | null;
  scheduledDeliveryActive?: boolean;
  scheduledDeliveryMinDays?: number | null;
  scheduledDeliveryPrice?: number | null;
  isActive?: boolean;
};
