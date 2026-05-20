/**
 * SERVICE ViaCEP - Integração com API ViaCEP
 *
 * ⚠️ FUNCIONALIDADE VÁLIDA APENAS PARA ENTREGA PRÓPRIA
 *
 * Busca endereço por CEP. Usado no admin para sugerir bairro/cidade/UF
 * ao cadastrar regiões e bairros avulsos.
 */

import type { ViaCepResponse } from "../types/shipping";

/**
 * URL base da API ViaCEP
 */
const VIA_CEP_URL = "https://viacep.com.br/ws";
const OPEN_CEP_URL = "https://opencep.com/v1";
const OPEN_CEP_TIMEOUT_MS = 1400;
const VIA_CEP_TIMEOUT_MS = 2500;
const viaCepCache = new Map<string, ViaCepResponse>();

async function fetchJsonWithTimeout<T>(
  url: string,
  timeoutMs: number,
): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeCepApiResponse(
  data: ViaCepResponse | null,
): ViaCepResponse | null {
  if (!data || data.erro) {
    return null;
  }

  const cep = data.cep?.replace(/\D/g, "") || "";

  if (cep.length !== 8 || !data.bairro || !data.localidade || !data.uf) {
    return null;
  }

  return {
    ...data,
    cep,
    uf: data.uf.toUpperCase(),
  };
}

/**
 * Busca endereço pelo CEP
 * @param cep - CEP com ou sem hífen (ex: "01415-001" ou "01415001")
 * @returns Dados do endereço ou null se não encontrado
 */
export async function fetchAddressByCep(
  cep: string,
): Promise<ViaCepResponse | null> {
  // Remove hífen e espaços do CEP
  const cleanCep = cep.replace(/\D/g, "");

  // Valida se tem 8 dígitos
  if (cleanCep.length !== 8) {
    return null;
  }

  const cachedAddress = viaCepCache.get(cleanCep);
  if (cachedAddress) {
    return cachedAddress;
  }

  try {
    const openCepAddress = normalizeCepApiResponse(
      await fetchJsonWithTimeout<ViaCepResponse>(
        `${OPEN_CEP_URL}/${cleanCep}.json`,
        OPEN_CEP_TIMEOUT_MS,
      ),
    );

    if (openCepAddress) {
      viaCepCache.set(cleanCep, openCepAddress);
      return openCepAddress;
    }
  } catch (error) {
    console.error("Erro ao buscar CEP no OpenCEP:", error);
  }

  try {
    const viaCepAddress = normalizeCepApiResponse(
      await fetchJsonWithTimeout<ViaCepResponse>(
        `${VIA_CEP_URL}/${cleanCep}/json/`,
        VIA_CEP_TIMEOUT_MS,
      ),
    );

    if (viaCepAddress) {
      viaCepCache.set(cleanCep, viaCepAddress);
      return viaCepAddress;
    }
  } catch (error) {
    console.error("Erro ao buscar CEP no ViaCEP:", error);
  }

  return null;
}
