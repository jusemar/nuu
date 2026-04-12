/**
 * HOOK useModalidadesEntrega - Gerencia modalidades de entrega
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import type { ModalidadeEntrega, TipoModalidade } from '../types/modalidadesEntrega';

/**
 * Dados mockados para exemplo
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

export function useModalidadesEntrega() {
  // Lista de modalidades
  const [modalidades, setModalidades] = useState<ModalidadeEntrega[]>(mockModalidades);
  
  // Termo de busca
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtro por tipo
  const [filtroTipo, setFiltroTipo] = useState<TipoModalidade | 'todos'>('todos');
  
  // Estado de carregamento
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Filtra modalidades por termo de busca e tipo
   */
  const modalidadesFiltradas = useMemo(() => {
    let result = modalidades;
    
    // Filtra por tipo
    if (filtroTipo !== 'todos') {
      result = result.filter((m) => m.tipo === filtroTipo);
    }
    
    // Filtra por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (m) =>
          m.nome.toLowerCase().includes(term) ||
          m.descricao.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [modalidades, searchTerm, filtroTipo]);

  /**
   * Ativa ou desativa uma modalidade
   */
  const toggleModalidade = useCallback((id: string) => {
    setModalidades((prev) =>
      prev.map((m) =>
        m.id === id 
          ? { ...m, isActive: !m.isActive, updatedAt: new Date() } 
          : m
      )
    );
  }, []);

  /**
   * Adiciona nova modalidade
   */
  const addModalidade = useCallback((novaModalidade: Omit<ModalidadeEntrega, 'id' | 'createdAt' | 'updatedAt'>) => {
    const modalidade: ModalidadeEntrega = {
      ...novaModalidade,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setModalidades((prev) => [...prev, modalidade]);
  }, []);

  /**
   * Atualiza modalidade existente
   */
  const updateModalidade = useCallback((id: string, dados: Partial<ModalidadeEntrega>) => {
    setModalidades((prev) =>
      prev.map((m) =>
        m.id === id 
          ? { ...m, ...dados, updatedAt: new Date() } 
          : m
      )
    );
  }, []);

  /**
   * Remove modalidade
   */
  const removeModalidade = useCallback((id: string) => {
    setModalidades((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return {
    modalidades: modalidadesFiltradas,
    todasModalidades: modalidades,
    searchTerm,
    setSearchTerm,
    filtroTipo,
    setFiltroTipo,
    isLoading,
    toggleModalidade,
    addModalidade,
    updateModalidade,
    removeModalidade,
  };
}