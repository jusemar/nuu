/**
 * SERVICE statesService - Comunicação com API de estados
 * 
 * Por enquanto usa dados mockados. Depois substitui por chamadas reais à API.
 */

import type { State } from '../types/states';

/**
 * Dados mockados - simulam resposta do banco de dados
 */
const mockStates: State[] = [
  { uf: 'SP', name: 'São Paulo', isActive: true, citiesCount: 645, createdAt: new Date('2024-01-15') },
  { uf: 'RJ', name: 'Rio de Janeiro', isActive: true, citiesCount: 92, createdAt: new Date('2024-02-20') },
  { uf: 'MG', name: 'Minas Gerais', isActive: false, citiesCount: 0, createdAt: new Date('2024-03-10') },
  { uf: 'RS', name: 'Rio Grande do Sul', isActive: true, citiesCount: 497, createdAt: new Date('2024-04-05') },
  { uf: 'PR', name: 'Paraná', isActive: false, citiesCount: 0, createdAt: new Date('2024-05-12') },
];

/**
 * Simula delay de rede (1 segundo)
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Busca todos os estados
 */
export async function getStates(): Promise<State[]> {
  await delay(1000);
  return [...mockStates];
}

/**
 * Busca estado por UF
 */
export async function getStateByUf(uf: string): Promise<State | null> {
  await delay(500);
  const state = mockStates.find((s) => s.uf === uf);
  return state ? { ...state } : null;
}

/**
 * Cria novo estado
 */
export async function createState(state: Omit<State, 'createdAt'>): Promise<State> {
  await delay(800);
  const newState: State = {
    ...state,
    createdAt: new Date(),
  };
  mockStates.push(newState);
  return { ...newState };
}

/**
 * Atualiza status do estado (ativo/inativo)
 */
export async function updateStateStatus(uf: string, isActive: boolean): Promise<State> {
  await delay(600);
  const index = mockStates.findIndex((s) => s.uf === uf);
  if (index === -1) throw new Error('Estado não encontrado');
  
  mockStates[index] = { ...mockStates[index], isActive };
  return { ...mockStates[index] };
}

/**
 * Remove estado
 */
export async function deleteState(uf: string): Promise<void> {
  await delay(600);
  const index = mockStates.findIndex((s) => s.uf === uf);
  if (index === -1) throw new Error('Estado não encontrado');
  
  mockStates.splice(index, 1);
}