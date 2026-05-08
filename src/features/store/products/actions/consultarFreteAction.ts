"use server";

import { fetchAddressByCep } from "@/features/admin/logistics/entrega-propria/services/viaCepService";
import { getShippingPrice } from "@/features/admin/logistics/entrega-propria/services/shippingService";

export interface ConsultaFreteSucesso {
  found: true;
  shippingPrice: number;
  level: "cep-especifico" | "regiao" | "bairro-avulso";
  message: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface ConsultaFreteFalha {
  found: false;
  message: string;
}

export type ConsultaFreteResult = ConsultaFreteSucesso | ConsultaFreteFalha;

export async function consultarFreteAction(
  cep: string
): Promise<ConsultaFreteResult> {
  const cleanCep = cep.replace(/\D/g, "");

  if (cleanCep.length !== 8) {
    return { found: false, message: "CEP inválido" };
  }

  const endereco = await fetchAddressByCep(cleanCep);

  if (!endereco || !endereco.bairro) {
    return {
      found: false,
      message: "CEP não encontrado ou sem bairro cadastrado",
    };
  }

  const bairro = endereco.bairro;
  const cidade = endereco.localidade || "";
  const uf = endereco.uf || "";

  const result = await getShippingPrice(cleanCep, bairro, cidade, uf);

  if (!result.found) {
    return { found: false, message: result.message };
  }

  return {
    found: true,
    shippingPrice: result.shippingPrice,
    level: result.level,
    message: result.message,
    bairro,
    cidade,
    uf,
  };
}
