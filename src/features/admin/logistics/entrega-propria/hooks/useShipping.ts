/**
 * HOOK useShipping - Gerencia sistema de frete em 3 níveis
 *
 * ⚠️ FUNCIONALIDADE VÁLIDA APENAS PARA ENTREGA PRÓPRIA
 *
 * Busca, cria, edita, testa CEPs e controla estado do formulário.
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import type {
  ShippingRegion,
  BairroAvulso,
  CepEspecifico,
  CreateRegionData,
  CreateBairroAvulsoData,
  CreateCepEspecificoData,
  ViaCepResponse,
  RegioFieldState,
} from "../types/shipping";
import type { ShippingPriceResult, EstadoDropdown, CidadeDropdown } from "../services/shippingService";
import {
  getRegions,
  getBairrosAvulsos,
  getCepsEspecificos,
  createRegion,
  updateRegion,
  toggleRegion,
  deleteRegion,
  createBairroAvulso,
  updateBairroAvulso,
  toggleBairroAvulso,
  deleteBairroAvulso,
  createCepEspecifico,
  updateCepEspecifico,
  toggleCepEspecifico,
  deleteCepEspecifico,
  getShippingPrice,
  getEstadosAtivos,
  getCidadesAtivasPorEstado,
} from "../services/shippingService";
import { fetchAddressByCep } from "../services/viaCepService";

/**
 * Dias da semana para slots
 */
export const WEEK_DAYS = [
  { id: 0, name: "Domingo" },
  { id: 1, name: "Segunda-feira" },
  { id: 2, name: "Terça-feira" },
  { id: 3, name: "Quarta-feira" },
  { id: 4, name: "Quinta-feira" },
  { id: 5, name: "Sexta-feira" },
  { id: 6, name: "Sábado" },
];

export function useShipping() {
  // Estados principais
  const [regions, setRegions] = useState<ShippingRegion[]>([]);
  const [bairrosAvulsos, setBairrosAvulsos] = useState<BairroAvulso[]>([]);
  const [cepsEspecificos, setCepsEspecificos] = useState<CepEspecifico[]>([]);

  // Estados para dropdowns de cobertura
  const [estadosAtivos, setEstadosAtivos] = useState<EstadoDropdown[]>([]);
  const [cidadesAtivas, setCidadesAtivas] = useState<CidadeDropdown[]>([]);
  const [estadoSelecionado, setEstadoSelecionado] = useState("");

  // Estados de carregamento e busca
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Resultado do teste de frete
  const [shippingTestResult, setShippingTestResult] = useState<ShippingPriceResult | null>(null);

  // Estado do campo bairro/ViaCEP
  const [regioFieldState, setRegioFieldState] = useState<RegioFieldState>("idle");
  const [viaCepData, setViaCepData] = useState<ViaCepResponse | null>(null);

  /**
   * Carrega todos os dados de frete
   */
  const loadShippingData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [regionsData, bairrosData, cepsData, estadosData] = await Promise.all([
        getRegions(),
        getBairrosAvulsos(),
        getCepsEspecificos(),
        getEstadosAtivos(),
      ]);

      setRegions(regionsData);
      setBairrosAvulsos(bairrosData);
      setCepsEspecificos(cepsData);
      setEstadosAtivos(estadosData);
    } catch (error) {
      console.error("Erro ao carregar dados de frete:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Filtra por termo de busca
   */
  const filteredRegions = useMemo(() => {
    if (!searchTerm) return regions;

    const term = searchTerm.toLowerCase();
    return regions.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.city.toLowerCase().includes(term) ||
        r.bairros?.some((b) => b.neighborhood.toLowerCase().includes(term)),
    );
  }, [regions, searchTerm]);

  /**
   * Busca endereço pelo CEP (ViaCEP)
   */
  const searchCep = useCallback(async (cep: string) => {
    if (!cep || cep.replace(/\D/g, "").length !== 8) {
      setRegioFieldState("idle");
      setViaCepData(null);
      return;
    }

    setRegioFieldState("loading");

    try {
      const data = await fetchAddressByCep(cep);

      if (data && !data.erro) {
        setViaCepData(data);
        setRegioFieldState("suggested");
      } else {
        setViaCepData(null);
        setRegioFieldState("error");
      }
    } catch (error) {
      setViaCepData(null);
      setRegioFieldState("error");
    }
  }, []);

  /**
   * Confirma bairro sugerido
   */
  const confirmRegiao = useCallback(() => {
    if (viaCepData?.bairro) {
      setRegioFieldState("confirmed");
    }
  }, [viaCepData]);

  /**
   * Libera bairro para edição
   */
  const editRegiao = useCallback(() => {
    setRegioFieldState("manual");
  }, []);

  /**
   * Reseta estado do bairro
   */
  const resetRegiao = useCallback(() => {
    setRegioFieldState("idle");
    setViaCepData(null);
  }, []);

  /**
   * OPERAÇÕES REGIÕES
   */

  const addRegion = useCallback(
    async (data: CreateRegionData) => {
      setIsLoading(true);
      try {
        const newRegion = await createRegion(data);
        setRegions((prev) => [...prev, newRegion as ShippingRegion]);
        return newRegion;
      } catch (error) {
        console.error("Erro ao criar região:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const updateRegioData = useCallback(
    async (id: string, data: any) => {
      try {
        const updated = await updateRegion(id, data);
        setRegions((prev) =>
          prev.map((r) => (r.id === parseInt(id) ? (updated as ShippingRegion) : r)),
        );
        return updated;
      } catch (error) {
        console.error("Erro ao atualizar região:", error);
        throw error;
      }
    },
    [],
  );

  const toggleRegioStatus = useCallback(async (id: string) => {
    try {
      const updated = await toggleRegion(id);
      setRegions((prev) =>
        prev.map((r) => (r.id === parseInt(id) ? (updated as ShippingRegion) : r)),
      );
    } catch (error) {
      console.error("Erro ao alternar região:", error);
    }
  }, []);

  const removeRegion = useCallback(async (id: string) => {
    try {
      await deleteRegion(id);
      setRegions((prev) => prev.filter((r) => r.id !== parseInt(id)));
    } catch (error) {
      console.error("Erro ao remover região:", error);
    }
  }, []);

  /**
   * OPERAÇÕES BAIRROS AVULSOS
   */

  const addBairroAvulso = useCallback(
    async (data: CreateBairroAvulsoData) => {
      setIsLoading(true);
      try {
        const newBairro = await createBairroAvulso(data);
        setBairrosAvulsos((prev) => [...prev, newBairro as BairroAvulso]);
        return newBairro;
      } catch (error) {
        console.error("Erro ao criar bairro avulso:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const updateBairroData = useCallback(
    async (id: string, data: any) => {
      try {
        const updated = await updateBairroAvulso(id, data);
        setBairrosAvulsos((prev) =>
          prev.map((b) => (b.id === parseInt(id) ? (updated as BairroAvulso) : b)),
        );
        return updated;
      } catch (error) {
        console.error("Erro ao atualizar bairro avulso:", error);
        throw error;
      }
    },
    [],
  );

  const toggleBairroStatus = useCallback(async (id: string) => {
    try {
      const updated = await toggleBairroAvulso(id);
      setBairrosAvulsos((prev) =>
        prev.map((b) => (b.id === parseInt(id) ? (updated as BairroAvulso) : b)),
      );
    } catch (error) {
      console.error("Erro ao alternar bairro avulso:", error);
    }
  }, []);

  const removeBairro = useCallback(async (id: string) => {
    try {
      await deleteBairroAvulso(id);
      setBairrosAvulsos((prev) => prev.filter((b) => b.id !== parseInt(id)));
    } catch (error) {
      console.error("Erro ao remover bairro avulso:", error);
    }
  }, []);

  /**
   * OPERAÇÕES CEPs ESPECÍFICOS
   */

  const addCepEspecifico = useCallback(
    async (data: CreateCepEspecificoData) => {
      setIsLoading(true);
      try {
        const newCep = await createCepEspecifico(data);
        setCepsEspecificos((prev) => [...prev, newCep as CepEspecifico]);
        return newCep;
      } catch (error) {
        console.error("Erro ao criar CEP específico:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const updateCepData = useCallback(
    async (id: string, data: any) => {
      try {
        const updated = await updateCepEspecifico(id, data);
        setCepsEspecificos((prev) =>
          prev.map((c) => (c.id === parseInt(id) ? (updated as CepEspecifico) : c)),
        );
        return updated;
      } catch (error) {
        console.error("Erro ao atualizar CEP específico:", error);
        throw error;
      }
    },
    [],
  );

  const toggleCepStatus = useCallback(async (id: string) => {
    try {
      const updated = await toggleCepEspecifico(id);
      setCepsEspecificos((prev) =>
        prev.map((c) => (c.id === parseInt(id) ? (updated as CepEspecifico) : c)),
      );
    } catch (error) {
      console.error("Erro ao alternar CEP específico:", error);
    }
  }, []);

  const removeCep = useCallback(async (id: string) => {
    try {
      await deleteCepEspecifico(id);
      setCepsEspecificos((prev) => prev.filter((c) => c.id !== parseInt(id)));
    } catch (error) {
      console.error("Erro ao remover CEP específico:", error);
    }
  }, []);

  /**
   * TESTE DE FRETE
   */

  const testShipping = useCallback(
    async (cep: string, neighborhood: string, city: string, state: string) => {
      setIsLoading(true);
      try {
        const result = await getShippingPrice(cep, neighborhood, city, state);
        setShippingTestResult(result);
        return result;
      } catch (error) {
        console.error("Erro ao testar frete:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const clearShippingTest = useCallback(() => {
    setShippingTestResult(null);
  }, []);

  const carregarCidadesPorEstado = useCallback(async (uf: string) => {
    if (!uf) {
      setCidadesAtivas([]);
      return;
    }
    setEstadoSelecionado(uf);
    const data = await getCidadesAtivasPorEstado(uf);
    setCidadesAtivas(data);
  }, []);

  return {
    // Estados
    regions: filteredRegions,
    allRegions: regions,
    bairrosAvulsos,
    cepsEspecificos,
    isLoading,
    searchTerm,
    setSearchTerm,
    shippingTestResult,
    regioFieldState,
    viaCepData,

    // Ações ViaCEP
    searchCep,
    confirmRegiao,
    editRegiao,
    resetRegiao,

    // Ações regiões
    loadShippingData,
    addRegion,
    updateRegioData,
    toggleRegioStatus,
    removeRegion,

    // Ações bairros
    addBairroAvulso,
    updateBairroData,
    toggleBairroStatus,
    removeBairro,

    // Ações CEPs
    addCepEspecifico,
    updateCepData,
    toggleCepStatus,
    removeCep,

    // Teste
    testShipping,
    clearShippingTest,

    // Utilitários
    weekDays: WEEK_DAYS,

    // Dropdowns de cobertura (estado/cidade)
    estadosAtivos,
    cidadesAtivas,
    estadoSelecionado,
    carregarCidadesPorEstado,
  };
}
