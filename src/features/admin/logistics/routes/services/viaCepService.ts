/**
 * SERVICE ViaCEP - Integração com API ViaCEP
 * 
 * Busca endereço por CEP. Usado no admin para sugerir bairro/cidade/UF
 * ao cadastrar rotas de entrega.
 */

import type { ViaCepResponse } from '../types/routes';

/**
 * URL base da API ViaCEP
 */
const VIA_CEP_URL = 'https://viacep.com.br/ws';

/**
 * Busca endereço pelo CEP
 * @param cep - CEP com ou sem hífen (ex: "01415-001" ou "01415001")
 * @returns Dados do endereço ou null se não encontrado
 */
export async function fetchAddressByCep(cep: string): Promise<ViaCepResponse | null> {
  // Remove hífen e espaços do CEP
  const cleanCep = cep.replace(/\D/g, '');
  
  // Valida se tem 8 dígitos
  if (cleanCep.length !== 8) {
    return null;
  }
  
  try {
    // Faz requisição à API ViaCEP
    const response = await fetch(`${VIA_CEP_URL}/${cleanCep}/json/`);
    
    // Se resposta não OK, retorna null
    if (!response.ok) {
      return null;
    }
    
    // Converte para JSON
    const data: ViaCepResponse = await response.json();
    
    // ViaCEP retorna { erro: true } quando CEP não existe
    if (data.erro) {
      return null;
    }
    
    return data;
    
  } catch (error) {
    // Erro de rede, timeout, etc
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
}

/**
 * Formata CEP para exibição (00000-000)
 */
export function formatCep(cep: string): string {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return cep;
  return `${clean.slice(0, 5)}-${clean.slice(5)}`;
}

/**
 * Remove formatação do CEP (00000000)
 */
export function unformatCep(cep: string): string {
  return cep.replace(/\D/g, '');
}