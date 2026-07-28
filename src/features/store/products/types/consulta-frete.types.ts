import type { PromessaEntregaPropria } from "@/features/logistica/lib/entrega-propria/calcular-promessa-entrega-propria";
import type { ResultadoFreteGratisProgressivo } from "@/features/promocoes/services";

export interface ConsultaFreteSucesso {
  found: true;
  shippingPrice: number;
  shippingPriceOriginal?: number;
  freteGratisPromocionalAplicado?: boolean;
  regraFreteGratisAplicadaId?: string | null;
  deliveryDeadline?: string | null;
  promessaEntrega?: PromessaEntregaPropria | null;
  level: "cep-especifico" | "regiao" | "bairro-avulso" | "cidade";
  message: string;
  bairro: string;
  cidade: string;
  uf: string;
  endereco: EnderecoFreteConsultado;
  opcoesEntrega?: OpcaoEntregaCotada[];
}

export interface ConsultaFreteFalha {
  found: false;
  message: string;
  endereco?: EnderecoFreteConsultado;
  opcoesEntrega?: OpcaoEntregaCotada[];
}

export type ConsultaFreteResult = ConsultaFreteSucesso | ConsultaFreteFalha;

export type EnderecoFreteConsultado = {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export type OpcaoEntregaCotada = {
  identificador: string;
  provedor: string;
  servico: string;
  nome: string;
  prazo: string | null;
  valorEmCentavos: number;
  valorOriginalEmCentavos?: number;
  freteGratisPromocionalAplicado?: boolean;
  regraFreteGratisAplicadaId?: string | null;
  freteGratisProgressivo?: ResultadoFreteGratisProgressivo;
  transportadora?: string | null;
};
