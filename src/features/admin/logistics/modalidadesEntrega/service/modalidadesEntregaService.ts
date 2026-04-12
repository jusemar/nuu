/**
 * SERVICE modalidadesEntregaService - Comunicação com API de modalidades
 * 
 * Por enquanto usa dados mockados.
 */

import type { ModalidadeEntrega, TipoModalidade } from '../types/modalidadesEntrega';

/**
 * Dados mockados
 */
const mockModalidades: ModalidadeEntrega[] = [
  {
    id: '1',
    nome: 'Entrega Hoje',
    tipo: 'motoboy',
    descricao: 'Entrega no mesmo dia para pedidos até 12h',
    isActive: true,
    preco: { fixo: 15.0, freteGratisAcima: 200 },
    prazoDias: { min: 0, max: 0 },
    horariosCorte: [{ dia: 'todos', horario: '12:00' }],
    permiteAgendamento: false,
    diasOperacao: [1, 2, 3, 4, 5, 6],
    pesoMaximo: 10,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    nome: 'Entrega Econômica',
    tipo: 'transportadora',
    descricao: 'Entrega em 5 a 10 dias úteis',
    isActive: true,
    preco: { fixo: 5.0, freteGratisAcima: 150 },
    prazoDias: { min: 5, max: 10 },
    horariosCorte: [],
    permiteAgendamento: true,
    diasOperacao: [1, 2, 3, 4, 5],
    pesoMaximo: 30,
    dimensoesMaximas: { comprimento: 100, largura: 60, altura: 60 },
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20'),
  },
  {
    id: '3',
    nome: 'Retirada na Loja',
    tipo: 'retirada',
    descricao: 'Cliente retira no local em horário comercial',
    isActive: true,
    preco: { fixo: 0 },
    prazoDias: { min: 0, max: 0 },
    horariosCorte: [],
    permiteAgendamento: true,
    diasOperacao: [1, 2, 3, 4, 5, 6],
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-10'),
  },
  {
    id: '4',
    nome: 'Fornecedor Direto',
    tipo: 'fornecedor',
    descricao: 'Entrega realizada diretamente pelo fornecedor',
    isActive: false,
    preco: { fixo: 0 },
    prazoDias: { min: 7, max: 15 },
    horariosCorte: [{ dia: 'todos', horario: '14:00' }],
    permiteAgendamento: true,
    diasOperacao: [1, 2, 3, 4, 5],
    createdAt: new Date('2024-04-05'),
    updatedAt: new Date('2024-04-05'),
  },
];

/**
 * Simula delay de rede
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Busca todas as modalidades (opcionalmente filtradas por tipo)
 */
export async function getModalidades(tipo?: TipoModalidade): Promise<ModalidadeEntrega[]> {
  await delay(1000);
  
  if (tipo) {
    return mockModalidades.filter((m) => m.tipo === tipo);
  }
  
  return [...mockModalidades];
}

/**
 * Busca modalidade por ID
 */
export async function getModalidadeById(id: string): Promise<ModalidadeEntrega | null> {
  await delay(500);
  const modalidade = mockModalidades.find((m) => m.id === id);
  return modalidade ? { ...modalidade } : null;
}

/**
 * Cria nova modalidade
 */
export async function createModalidade(
  modalidade: Omit<ModalidadeEntrega, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ModalidadeEntrega> {
  await delay(800);
  const novaModalidade: ModalidadeEntrega = {
    ...modalidade,
    id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockModalidades.push(novaModalidade);
  return { ...novaModalidade };
}

/**
 * Atualiza modalidade existente
 */
export async function updateModalidade(
  id: string,
  dados: Partial<ModalidadeEntrega>
): Promise<ModalidadeEntrega> {
  await delay(600);
  const index = mockModalidades.findIndex((m) => m.id === id);
  if (index === -1) throw new Error('Modalidade não encontrada');
  
  mockModalidades[index] = { 
    ...mockModalidades[index], 
    ...dados, 
    updatedAt: new Date() 
  };
  return { ...mockModalidades[index] };
}

/**
 * Atualiza status (ativo/inativo)
 */
export async function updateModalidadeStatus(id: string, isActive: boolean): Promise<ModalidadeEntrega> {
  await delay(600);
  const index = mockModalidades.findIndex((m) => m.id === id);
  if (index === -1) throw new Error('Modalidade não encontrada');
  
  mockModalidades[index] = { 
    ...mockModalidades[index], 
    isActive, 
    updatedAt: new Date() 
  };
  return { ...mockModalidades[index] };
}

/**
 * Remove modalidade
 */
export async function deleteModalidade(id: string): Promise<void> {
  await delay(600);
  const index = mockModalidades.findIndex((m) => m.id === id);
  if (index === -1) throw new Error('Modalidade não encontrada');
  
  mockModalidades.splice(index, 1);
}