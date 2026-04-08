/**
 * HOOK useStates - Gerencia estados de atendimento
 * 
 * Busca, filtra, adiciona e atualiza status de estados.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import type { State } from '../types/states';

/**
 * Dados mockados para exemplo - depois virão da API
 */
const mockStates: State[] = [
  { uf: 'SP', name: 'São Paulo', isActive: true, citiesCount: 645, createdAt: new Date('2024-01-15') },
  { uf: 'RJ', name: 'Rio de Janeiro', isActive: true, citiesCount: 92, createdAt: new Date('2024-02-20') },
  { uf: 'MG', name: 'Minas Gerais', isActive: false, citiesCount: 0, createdAt: new Date('2024-03-10') },
];

export function useStates() {
  // Lista de estados
  const [states, setStates] = useState<State[]>(mockStates);
  
  // Termo de busca (nome ou UF)
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado de carregamento
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Filtra estados por termo de busca
   */
  const filteredStates = useMemo(() => {
    if (!searchTerm) return states;
    
    const term = searchTerm.toLowerCase();
    return states.filter(
      (state) =>
        state.name.toLowerCase().includes(term) ||
        state.uf.toLowerCase().includes(term)
    );
  }, [states, searchTerm]);

  /**
   * Ativa ou desativa um estado
   */
  const toggleState = useCallback((uf: string) => {
    setStates((prev) =>
      prev.map((state) =>
        state.uf === uf ? { ...state, isActive: !state.isActive } : state
      )
    );
  }, []);

  /**
   * Adiciona novo estado à lista
   */
  const addState = useCallback((newState: Omit<State, 'createdAt' | 'citiesCount'>) => {
    const state: State = {
      ...newState,
      citiesCount: 0,
      createdAt: new Date(),
    };
    setStates((prev) => [...prev, state]);
  }, []);

  /**
   * Remove estado da lista
   */
  const removeState = useCallback((uf: string) => {
    setStates((prev) => prev.filter((state) => state.uf !== uf));
  }, []);

  return {
    states: filteredStates,
    allStates: states,
    searchTerm,
    setSearchTerm,
    isLoading,
    toggleState,
    addState,
    removeState,
  };
}