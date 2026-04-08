/**
 * SERVICE citiesService - Comunicação com API de cidades
 * 
 * Por enquanto usa dados mockados.
 */

import type { City } from '../types/cities';

/**
 * Dados mockados
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
  { 
    id: '5', 
    name: 'Curitiba', 
    stateUf: 'PR', 
    isActive: true, 
    neighborhoodsCount: 3, 
    availableMethods: ['motoboy', 'transportadora'],
    createdAt: new Date('2024-05-12') 
  },
];

/**
 * Simula delay de rede
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Busca todas as cidades (opcionalmente filtradas por estado)
 */
export async function getCities(stateUf?: string): Promise<City[]> {
  await delay(1000);
  
  if (stateUf) {
    return mockCities.filter((city) => city.stateUf === stateUf);
  }
  
  return [...mockCities];
}

/**
 * Busca cidade por ID
 */
export async function getCityById(id: string): Promise<City | null> {
  await delay(500);
  const city = mockCities.find((c) => c.id === id);
  return city ? { ...city } : null;
}

/**
 * Cria nova cidade
 */
export async function createCity(city: Omit<City, 'id' | 'createdAt'>): Promise<City> {
  await delay(800);
  const newCity: City = {
    ...city,
    id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date(),
  };
  mockCities.push(newCity);
  return { ...newCity };
}

/**
 * Atualiza status da cidade
 */
export async function updateCityStatus(id: string, isActive: boolean): Promise<City> {
  await delay(600);
  const index = mockCities.findIndex((c) => c.id === id);
  if (index === -1) throw new Error('Cidade não encontrada');
  
  mockCities[index] = { ...mockCities[index], isActive };
  return { ...mockCities[index] };
}

/**
 * Remove cidade
 */
export async function deleteCity(id: string): Promise<void> {
  await delay(600);
  const index = mockCities.findIndex((c) => c.id === id);
  if (index === -1) throw new Error('Cidade não encontrada');
  
  mockCities.splice(index, 1);
}