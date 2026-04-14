/**
 * HOOK useFornecedores - Gerencia fornecedores
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
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
  {
    id: '3',
    nome: 'Transportadora Rápida',
    tipo: 'transportadora',
    descricao: 'Entrega em 2-5 dias para todo Brasil',
    isActive: false,
    configuracao: {
      prazoMin: 2,
      prazoMax: 5,
      horarioCorte: '10:00',
      diasOperacao: [1, 2, 3, 4, 5],
      freteFixo: 25,
    },
    regioesAtendidas: ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'],
    produtosVinculados: 0,
    contato: {
      email: 'logistica@rapidatransportes.com',
      telefone: '0800-123-4567',
    },
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
];

export function useFornecedores() {
  // Lista de fornecedores
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(mockFornecedores);
  
  // Termo de busca
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtro por tipo
  const [filtroTipo, setFiltroTipo] = useState<TipoFornecedor | 'todos'>('todos');
  
  // Estado de carregamento
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Filtra fornecedores
   */
  const fornecedoresFiltrados = useMemo(() => {
    let result = fornecedores;
    
    // Filtra por tipo
    if (filtroTipo !== 'todos') {
      result = result.filter((f) => f.tipo === filtroTipo);
    }
    
    // Filtra por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (f) =>
          f.nome.toLowerCase().includes(term) ||
          f.descricao.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [fornecedores, searchTerm, filtroTipo]);

  /**
   * Ativa ou desativa fornecedor
   */
  const toggleFornecedor = useCallback((id: string) => {
    setFornecedores((prev) =>
      prev.map((f) =>
        f.id === id 
          ? { ...f, isActive: !f.isActive, updatedAt: new Date() } 
          : f
      )
    );
  }, []);

  /**
   * Adiciona novo fornecedor
   */
  const addFornecedor = useCallback((novoFornecedor: Omit<Fornecedor, 'id' | 'createdAt' | 'updatedAt'>) => {
    const fornecedor: Fornecedor = {
      ...novoFornecedor,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setFornecedores((prev) => [...prev, fornecedor]);
  }, []);

  /**
   * Remove fornecedor
   */
  const removeFornecedor = useCallback((id: string) => {
    setFornecedores((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return {
    fornecedores: fornecedoresFiltrados,
    todosFornecedores: fornecedores,
    searchTerm,
    setSearchTerm,
    filtroTipo,
    setFiltroTipo,
    isLoading,
    toggleFornecedor,
    addFornecedor,
    removeFornecedor,
  };
}