/**
 * HOOK useCities - Gerencia cidades de atendimento
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import type { City } from '../types/cities';

/**
 * Dados mockados para exemplo
 */
const mockCities: City[] = [
  { 
    id: '1', 
    name: 'São Paulo', 
    stateUf: 'SP', 
    isActive: true, 
    neighborhoodsCount: 0, 
    availableMethods: ['motoboy', 'transportadora'],
    createdAt: new Date('2024-01-15') 
  },
  { 
    id: '2', 
    name: 'Campinas', 
    stateUf: 'SP', 
    isActive: true, 
    neighborhoodsCount: 5, 
    availableMethods: ['transportadora'],
    createdAt: new Date('2024-02-20') 
  },
  { 
    id: '3', 
    name: 'Rio de Janeiro', 
    stateUf: 'RJ', 
    isActive: false, 
    neighborhoodsCount: 0, 
    availableMethods: [],
    createdAt: new Date('2024-03-10') 
  },
  { 
    id: '4', 
    name: 'Belo Horizonte', 
    stateUf: 'MG', 
    isActive: true, 
    neighborhoodsCount: 0, 
    availableMethods: ['fornecedor'],
    createdAt: new Date('2024-04-05') 
  },
];

export function useCities(stateUf?: string) {
  // Lista de cidades
  const [cities, setCities] = useState<City[]>(mockCities);
  
  // Termo de busca
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado de carregamento
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Filtra cidades por estado (UF) e termo de busca
   */
  const filteredCities = useMemo(() => {
    let result = cities;
    
    // Filtra por estado se informado
    if (stateUf) {
      result = result.filter((city) => city.stateUf === stateUf);
    }
    
    // Filtra por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((city) =>
        city.name.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [cities, stateUf, searchTerm]);

  /**
   * Ativa ou desativa uma cidade
   */
  const toggleCity = useCallback((id: string) => {
    setCities((prev) =>
      prev.map((city) =>
        city.id === id ? { ...city, isActive: !city.isActive } : city
      )
    );
  }, []);

  /**
   * Adiciona nova cidade
   */
  const addCity = useCallback((newCity: Omit<City, 'id' | 'createdAt'>) => {
    const city: City = {
      ...newCity,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    setCities((prev) => [...prev, city]);
  }, []);

  /**
   * Remove cidade
   */
  const removeCity = useCallback((id: string) => {
    setCities((prev) => prev.filter((city) => city.id !== id));
  }, []);

  return {
    cities: filteredCities,
    allCities: cities,
    searchTerm,
    setSearchTerm,
    isLoading,
    toggleCity,
    addCity,
    removeCity,
  };
}