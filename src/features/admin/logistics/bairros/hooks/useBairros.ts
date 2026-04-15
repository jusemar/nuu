/**
 * HOOK useBairros - Gerencia bairros e slots de entrega
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Bairro, SlotEntrega, FaixaCep } from '../types/bairros';

/**
 * Dias da semana para slots
 */
const DIAS_SEMANA = [
  { id: 0, nome: 'Domingo' },
  { id: 1, nome: 'Segunda-feira' },
  { id: 2, nome: 'Terça-feira' },
  { id: 3, nome: 'Quarta-feira' },
  { id: 4, nome: 'Quinta-feira' },
  { id: 5, nome: 'Sexta-feira' },
  { id: 6, nome: 'Sábado' },
];

/**
 * Dados mockados - Jardins e Moema
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
  {
    id: '3',
    nome: 'Centro',
    cidade: 'Rio de Janeiro',
    estadoUf: 'RJ',
    faixaCep: {
      inicio: '20000000',
      fim: '20299999',
      display: '20000-000 a 20299-999',
    },
    slots: [],
    hasSlotsActive: false,
    isActive: false,
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-05'),
  },
];

export function useBairros(cidadeFiltro?: string, estadoUfFiltro?: string) {
  // Lista de bairros
  const [bairros, setBairros] = useState<Bairro[]>(mockBairros);
  
  // Termo de busca
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado de carregamento
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Filtra bairros por cidade, estado e termo de busca
   */
  const bairrosFiltrados = useMemo(() => {
    let result = bairros;
    
    // Filtra por estado
    if (estadoUfFiltro) {
      result = result.filter((b) => b.estadoUf === estadoUfFiltro);
    }
    
    // Filtra por cidade
    if (cidadeFiltro) {
      result = result.filter((b) => 
        b.cidade.toLowerCase() === cidadeFiltro.toLowerCase()
      );
    }
    
    // Filtra por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (b) =>
          b.nome.toLowerCase().includes(term) ||
          b.faixaCep.display.includes(term)
      );
    }
    
    return result;
  }, [bairros, cidadeFiltro, estadoUfFiltro, searchTerm]);

  /**
   * Verifica se um CEP pertence a algum bairro
   */
  const findBairroByCep = useCallback((cep: string): Bairro | null => {
    const cepNumerico = cep.replace(/\D/g, '');
    return bairros.find((b) => {
      const inicio = b.faixaCep.inicio;
      const fim = b.faixaCep.fim;
      return cepNumerico >= inicio && cepNumerico <= fim && b.isActive;
    }) || null;
  }, [bairros]);

  /**
   * Ativa ou desativa bairro
   */
  const toggleBairro = useCallback((id: string) => {
    setBairros((prev) =>
      prev.map((b) =>
        b.id === id 
          ? { ...b, isActive: !b.isActive, updatedAt: new Date() } 
          : b
      )
    );
  }, []);

  /**
   * Ativa ou desativa slot específico
   */
  const toggleSlot = useCallback((bairroId: string, slotId: string) => {
    setBairros((prev) =>
      prev.map((b) => {
        if (b.id !== bairroId) return b;
        
        const newSlots = b.slots.map((s) =>
          s.id === slotId ? { ...s, isActive: !s.isActive } : s
        );
        
        return {
          ...b,
          slots: newSlots,
          hasSlotsActive: newSlots.some((s) => s.isActive),
          updatedAt: new Date(),
        };
      })
    );
  }, []);

  /**
   * Adiciona novo bairro
   */
  const addBairro = useCallback((novoBairro: Omit<Bairro, 'id' | 'createdAt' | 'updatedAt' | 'hasSlotsActive'>) => {
    const bairro: Bairro = {
      ...novoBairro,
      id: Math.random().toString(36).substr(2, 9),
      hasSlotsActive: novoBairro.slots.some((s) => s.isActive),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setBairros((prev) => [...prev, bairro]);
  }, []);

  /**
   * Remove bairro
   */
  const removeBairro = useCallback((id: string) => {
    setBairros((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return {
    bairros: bairrosFiltrados,
    todosBairros: bairros,
    searchTerm,
    setSearchTerm,
    isLoading,
    findBairroByCep,
    toggleBairro,
    toggleSlot,
    addBairro,
    removeBairro,
    DIAS_SEMANA,
  };
}