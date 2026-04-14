/**
 * SERVICE fornecedoresService - Comunicação com API de fornecedores
 * 
 * Por enquanto usa dados mockados.
 */

import type { Fornecedor, TipoFornecedor } from '../types/fornecedores';

/**
 * Dados mockados
 */
const mockFornecedores: Fornecedor[] = [
  {
    id: '1',
    nome: 'Loja Própria',
    tipo: 'proprio',
    descricao: 'Entrega própria da loja em cidade local',
    isActive: true,
    configuracao: {
      prazoMin: 0,
      prazoMax: 0,
      horarioCorte: '12:00',
      diasOperacao: [1, 2, 3, 4, 5, 6],
      freteFixo: 10,
      freteGratisAcima: 200,
    },
    regioesAtendidas: ['SP', 'RJ'],
    produtosVinculados: 45,
    contato: {
      email: 'loja@exemplo.com',
      telefone: '(11) 99999-9999',
    },
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: '2',
    nome: 'Fornecedor Silva Ltda',
    tipo: 'fornecedor',
    descricao: 'Entrega em 7-15 dias úteis, frete grátis acima de R$ 200',
    isActive: true,
    configuracao: {
      prazoMin: 7,
      prazoMax: 15,
      horarioCorte: '14:00',
      diasOperacao: [1, 2, 3, 4, 5],
      freteFixo: 0,
      freteGratisAcima: 200,
    },
    regioesAtendidas: ['SP', 'RJ', 'MG', 'RS', 'PR'],
    produtosVinculados: 12,
    contato: {
      email: 'contato@silva.com',
      telefone: '(11) 98888-8888',
    },
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
];

/**
 * Simula delay de rede
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Busca todos os fornecedores
 */
export async function getFornecedores(tipo?: TipoFornecedor): Promise<Fornecedor[]> {
  await delay(1000);
  
  if (tipo) {
    return mockFornecedores.filter((f) => f.tipo === tipo);
  }
  
  return [...mockFornecedores];
}

/**
 * Busca fornecedor por ID
 */
export async function getFornecedorById(id: string): Promise<Fornecedor | null> {
  await delay(500);
  const fornecedor = mockFornecedores.find((f) => f.id === id);
  return fornecedor ? { ...fornecedor } : null;
}

/**
 * Cria novo fornecedor
 */
export async function createFornecedor(
  fornecedor: Omit<Fornecedor, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Fornecedor> {
  await delay(800);
  const novoFornecedor: Fornecedor = {
    ...fornecedor,
    id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockFornecedores.push(novoFornecedor);
  return { ...novoFornecedor };
}

/**
 * Atualiza status (ativo/inativo)
 */
export async function updateFornecedorStatus(id: string, isActive: boolean): Promise<Fornecedor> {
  await delay(600);
  const index = mockFornecedores.findIndex((f) => f.id === id);
  if (index === -1) throw new Error('Fornecedor não encontrado');
  
  mockFornecedores[index] = { 
    ...mockFornecedores[index], 
    isActive, 
    updatedAt: new Date() 
  };
  return { ...mockFornecedores[index] };
}

/**
 * Remove fornecedor
 */
export async function deleteFornecedor(id: string): Promise<void> {
  await delay(600);
  const index = mockFornecedores.findIndex((f) => f.id === id);
  if (index === -1) throw new Error('Fornecedor não encontrado');
  
  mockFornecedores.splice(index, 1);
}