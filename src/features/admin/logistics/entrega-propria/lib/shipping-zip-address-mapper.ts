import type { ShippingZipAddress } from "@/db/table/logistics/entrega-propria";
import type { ViaCepResponse } from "../types/shipping";

export type EnderecoCepEntregaPropria = {
  cep: string;
  logradouro: string;
  complemento?: string | null;
  bairro: string;
  localidade: string;
  uf: string;
  ibge?: string | null;
  source: string;
};

export function mapShippingZipAddressToEnderecoCep(
  address: ShippingZipAddress,
): EnderecoCepEntregaPropria {
  return {
    cep: address.cep,
    logradouro: address.street,
    complemento: address.complement,
    bairro: address.neighborhood,
    localidade: address.city,
    uf: address.state,
    ibge: address.ibgeCode,
    source: address.source,
  };
}

export function mapViaCepToEnderecoCep(
  address: ViaCepResponse,
  source: string,
): EnderecoCepEntregaPropria | null {
  const cep = address.cep?.replace(/\D/g, "") || "";
  const bairro = address.bairro?.trim() || "";
  const localidade = address.localidade?.trim() || "";
  const uf = address.uf?.trim().toUpperCase() || "";

  if (cep.length !== 8 || !bairro || !localidade || uf.length !== 2) {
    return null;
  }

  return {
    cep,
    logradouro: address.logradouro?.trim() || "",
    complemento: address.complemento?.trim() || null,
    bairro,
    localidade,
    uf,
    ibge: address.ibge?.trim() || null,
    source,
  };
}
