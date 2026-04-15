/**
 * SERVICE bairrosService - Comunicação com API de bairros
 * 
 * Por enquanto usa dados mockados.
 */

import type { Bairro } from '../types/bairros';

/**
 * Dados mockados
 */
const mockBairros: Bairro[] = [
  {
    id: '1',
    nome: 'Jardins',
    cidade: 'São Paulo',
    estadoUf: 'SP',
    faixaCep: {
      inicio: '01400000',
      fim: '01599999',
      display: '01400-000 a 01599-999',
    },
    slots: [
      { id: 's1', diaSemana: 1, diaNome: 'Segunda-feira', horarioInicio: '08:00', horarioFim: '13:00', preco: 10, isActive: true },
      { id: 's2', diaSemana: 3, diaNome: 'Quarta-feira', horarioInicio: '12:00', horarioFim: '18:00', preco: 10, isActive: true },
      { id: 's3', diaSemana: 5, diaNome: 'Sexta-feira', horarioInicio: '08:00', horarioFim: '18:00', preco: 15, isActive: true },
    ],
    hasSlotsActive: true,
    isActive: true,
    totalEntregas: 150,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-03-15'),
  },
  {
    id: '2',
    nome: 'Moema',
    cidade: 'São Paulo',
    estadoUf: 'SP',
    faixaCep: {
      inicio: '04000000',
      fim: '04199999',
      display: '04000-000 a 04199-999',
    },
    slots: [
      { id: 's4', diaSemana: 2, diaNome: 'Terça-feira', horarioInicio: '08:00', horarioFim: '13:00', preco: 12, isActive: true },
      { id: 's5', diaSemana: 4, diaNome: 'Quinta-feira', horarioInicio: '12:00', horarioFim: '18:00', preco: 12, isActive: true },
    ],
    hasSlotsActive: true,
    isActive: true,
    totalEntregas: 89,
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-03-10'),
  },
];

/**
 * Simula delay de rede
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Busca todos os bairros (opcionalmente filtrados por cidade/estado)
 */
export async function getBairros(cidade?: string, estadoUf?: string): Promise<Bairro[]> {
  await delay(1000);
  
  let result = [...mockBairros];
  
  if (estadoUf) {
    result = result.filter((b) => b.estadoUf === estadoUf);
  }
  
  if (cidade) {
    result = result.filter((b) => b.cidade.toLowerCase() === cidade.toLowerCase());
  }
  
  return result;
}

/**
 * Busca bairro por ID
 */
export async function getBairroById(id: string): Promise<Bairro | null> {
  await delay(500);
  const bairro = mockBairros.find((b) => b.id === id);
  return bairro ? { ...bairro } : null;
}

/**
 * Busca bairro por CEP
 */
export async function getBairroByCep(cep: string): Promise<Bairro | null> {
  await delay(300);
  const cepNumerico = cep.replace(/\D/g, '');
  const bairro = mockBairros.find((b) => {
    const inicio = b.faixaCep.inicio;
    const fim = b.faixaCep.fim;
    return cepNumerico >= inicio && cepNumerico <= fim && b.isActive;
  });
  return bairro ? { ...bairro } : null;
}

/**
 * Cria novo bairro
 */
export async function createBairro(bairro: Omit<Bairro, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bairro> {
  await delay(800);
  const novoBairro: Bairro = {
    ...bairro,
    id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockBairros.push(novoBairro);
  return { ...novoBairro };
}

/**
 * Atualiza status do bairro
 */
export async function updateBairroStatus(id: string, isActive: boolean): Promise<Bairro> {
  await delay(600);
  const index = mockBairros.findIndex((b) => b.id === id);
  if (index === -1) throw new Error('Bairro não encontrado');
  
  mockBairros[index] = { 
    ...mockBairros[index], 
    isActive, 
    updatedAt: new Date() 
  };
  return { ...mockBairros[index] };
}

/**
 * Atualiza slots do bairro
 */
export async function updateBairroSlots(id: string, slots: Bairro['slots']): Promise<Bairro> {
  await delay(600);
  const index = mockBairros.findIndex((b) => b.id === id);
  if (index === -1) throw new Error('Bairro não encontrado');
  
  mockBairros[index] = {
    ...mockBairros[index],
    slots,
    hasSlotsActive: slots.some((s) => s.isActive),
    updatedAt: new Date(),
  };
  return { ...mockBairros[index] };
}

/**
 * Remove bairro
 */
export async function deleteBairro(id: string): Promise<void> {
  await delay(600);
  const index = mockBairros.findIndex((b) => b.id === id);
  if (index === -1) throw new Error('Bairro não encontrado');
  
  mockBairros.splice(index, 1);
}