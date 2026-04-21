/**
 * HOOK useRoutes - Gerencia rotas de entrega no admin
 * 
 * Busca, cria, edita, testa CEPs e controla estado do formulário.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import type { 
  DeliveryRoute, 
  CreateRouteData, 
  CepTestResult,
  ViaCepResponse,
  BairroFieldState 
} from '../types/routes';
import { 
  getRoutes, 
  createRoute, 
  updateRoute, 
  toggleRoute, 
  deleteRoute,
  testCep,
  checkCepOverlap
} from '../services/routesService';
import { fetchAddressByCep } from '../services/viaCepService';

/**
 * Dias da semana para slots
 */
export const WEEK_DAYS = [
  { id: 0, name: 'Domingo' },
  { id: 1, name: 'Segunda-feira' },
  { id: 2, name: 'Terça-feira' },
  { id: 3, name: 'Quarta-feira' },
  { id: 4, name: 'Quinta-feira' },
  { id: 5, name: 'Sexta-feira' },
  { id: 6, name: 'Sábado' },
];

export function useRoutes() {
  // Lista de rotas
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  
  // Estado de carregamento
  const [isLoading, setIsLoading] = useState(false);
  
  // Termo de busca
  const [searchTerm, setSearchTerm] = useState('');
  
  // Resultado do teste de CEP
  const [cepTestResult, setCepTestResult] = useState<CepTestResult | null>(null);
  
  // Estado do campo bairro no formulário
  const [bairroState, setBairroState] = useState<BairroFieldState>('idle');
  
  // Dados do ViaCEP retornados
  const [viaCepData, setViaCepData] = useState<ViaCepResponse | null>(null);

  /**
   * Busca todas as rotas
   */
  const loadRoutes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRoutes();
      setRoutes(data);
    } catch (error) {
      console.error('Erro ao carregar rotas:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Filtra rotas por termo de busca
   */
  const filteredRoutes = useMemo(() => {
    if (!searchTerm) return routes;
    
    const term = searchTerm.toLowerCase();
    return routes.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.registeredNeighborhood.toLowerCase().includes(term) ||
        r.city.toLowerCase().includes(term) ||
        r.cepStartDisplay.includes(term)
    );
  }, [routes, searchTerm]);

  /**
   * Busca endereço pelo CEP (ViaCEP)
   */
  const searchCep = useCallback(async (cep: string) => {
    if (!cep || cep.replace(/\D/g, '').length !== 8) {
      setBairroState('idle');
      setViaCepData(null);
      return;
    }
    
    setBairroState('loading');
    
    try {
      const data = await fetchAddressByCep(cep);
      
      if (data) {
        setViaCepData(data);
        setBairroState('suggested');
      } else {
        setViaCepData(null);
        setBairroState('error');
      }
    } catch (error) {
      setViaCepData(null);
      setBairroState('error');
    }
  }, []);

  /**
   * Confirma bairro sugerido pelo ViaCEP
   */
  const confirmBairro = useCallback(() => {
    if (viaCepData?.bairro) {
      setBairroState('confirmed');
    }
  }, [viaCepData]);

  /**
   * Libera bairro para edição manual
   */
  const editBairro = useCallback(() => {
    setBairroState('manual');
  }, []);

  /**
   * Reseta estado do bairro
   */
  const resetBairro = useCallback(() => {
    setBairroState('idle');
    setViaCepData(null);
  }, []);

  /**
   * Cria nova rota
   */
  const addRoute = useCallback(async (data: CreateRouteData) => {
    setIsLoading(true);
    try {
      // Verifica sobreposição
      const hasOverlap = await checkCepOverlap(data.cepStart, data.cepEnd);
      if (hasOverlap) {
        throw new Error('Faixa de CEP se sobrepõe com rota existente');
      }
      
      const newRoute = await createRoute(data);
      setRoutes((prev) => [...prev, newRoute]);
      return newRoute;
    } catch (error) {
      console.error('Erro ao criar rota:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Ativa/desativa rota
   */
  const toggleRouteStatus = useCallback(async (id: string) => {
    try {
      const updated = await toggleRoute(id);
      setRoutes((prev) =>
        prev.map((r) => (r.id === id ? updated : r))
      );
    } catch (error) {
      console.error('Erro ao alternar rota:', error);
    }
  }, []);

  /**
   * Remove rota
   */
  const removeRoute = useCallback(async (id: string) => {
    try {
      await deleteRoute(id);
      setRoutes((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Erro ao remover rota:', error);
    }
  }, []);

  /**
   * Testa se CEP está coberto
   */
  const testCepCoverage = useCallback(async (cep: string) => {
    setIsLoading(true);
    try {
      const result = await testCep(cep);
      setCepTestResult(result);
      return result;
    } catch (error) {
      console.error('Erro ao testar CEP:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Limpa resultado do teste
   */
  const clearCepTest = useCallback(() => {
    setCepTestResult(null);
  }, []);

  return {
    // Estados
    routes: filteredRoutes,
    allRoutes: routes,
    isLoading,
    searchTerm,
    setSearchTerm,
    cepTestResult,
    bairroState,
    viaCepData,
    
    // Ações de bairro/ViaCEP
    searchCep,
    confirmBairro,
    editBairro,
    resetBairro,
    
    // Ações de rotas
    loadRoutes,
    addRoute,
    toggleRouteStatus,
    removeRoute,
    
    // Teste de CEP
    testCepCoverage,
    clearCepTest,
    
    // Utilitários
    weekDays: WEEK_DAYS,
  };
}