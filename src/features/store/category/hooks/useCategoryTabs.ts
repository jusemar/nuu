// src/features/store/category/hooks/useCategoryTabs.ts
'use client';

import { useState, useEffect } from 'react';

// Tipo para as tabs
export interface TabItem {
  id: string;
  name: string;
  slug: string;
  isActive?: boolean;
  count?: number; // Quantidade de produtos (opcional)
}

interface UseCategoryTabsProps {
  currentCategorySlug: string;
  currentCategoryName: string;
}

// Dados fictícios para testar
const MOCK_TABS: Record<string, TabItem[]> = {
  'colchoes': [
    { id: '1', name: 'Todos', slug: 'colchoes', isActive: true },
    { id: '2', name: 'Colchão de Espuma', slug: 'colchao-espuma', count: 12 },
    { id: '3', name: 'Colchão de Molas', slug: 'colchao-molas', count: 8 },
    { id: '4', name: 'Colchão de Látex', slug: 'colchao-latex', count: 5 },
  ],
  'colchao-espuma': [
    { id: '1', name: 'Todos', slug: 'colchao-espuma', isActive: true },
    { id: '2', name: 'D20', slug: 'd20', count: 4 },
    { id: '3', name: 'D23', slug: 'd23', count: 6 },
    { id: '4', name: 'D28', slug: 'd28', count: 3 },
    { id: '5', name: 'Ortopédico', slug: 'ortopedico', count: 7 },
  ],
  'colchao-molas': [
    { id: '1', name: 'Todos', slug: 'colchao-molas', isActive: true },
    { id: '2', name: 'Bonnel', slug: 'bonnel', count: 5 },
    { id: '3', name: 'Pocket', slug: 'pocket', count: 9 },
    { id: '4', name: 'Ensacadas', slug: 'ensacadas', count: 4 },
  ],
};

export function useCategoryTabs({ currentCategorySlug }: UseCategoryTabsProps) {
  const [tabs, setTabs] = useState<TabItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simula carregamento assíncrono
    setIsLoading(true);
    
    // Timeout para simular requisição
    const timer = setTimeout(() => {
      // Pega os tabs mockados ou array vazio se não encontrar
      const mockTabs = MOCK_TABS[currentCategorySlug] || [];
      setTabs(mockTabs);
      setIsLoading(false);
    }, 300); // Delay de 300ms para ver o loading

    return () => clearTimeout(timer);
  }, [currentCategorySlug]);

  // Função para atualizar tab ativa (quando clicar)
  const setActiveTab = (slug: string) => {
    setTabs(prev => 
      prev.map(tab => ({
        ...tab,
        isActive: tab.slug === slug
      }))
    );
  };

  return {
    tabs,
    isLoading,
    setActiveTab,
    activeTab: tabs.find(t => t.isActive) || tabs[0]
  };
}