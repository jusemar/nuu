/**
 * PÁGINA DE CIDADES - Regiões de Atendimento
 * 
 * Lista cidades do estado selecionado com:
 * - Busca por nome
 * - Toggle ativar/desativar
 * - Indicador de bairros específicos
 * - Métodos de entrega disponíveis
 */

'use client';

import { useState } from 'react';
import { 
  Search, 
  Plus, 
  Building2, 
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  MapPin,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCities } from '../hooks/useCities';

interface CitiesPageProps {
  stateUf?: string;
  stateName?: string;
}

export function CitiesPage({ stateUf, stateName }: CitiesPageProps) {
  // Hook que gerencia cidades
  const { 
    cities, 
    searchTerm, 
    setSearchTerm, 
    toggleCity 
  } = useCities(stateUf);

  // Controla modal de adicionar
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Nome dos métodos para exibição
  const methodLabels: Record<string, string> = {
    motoboy: 'Motoboy',
    transportadora: 'Transportadora',
    fornecedor: 'Fornecedor',
    retirada: 'Retirada',
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* CABEÇALHO */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <a href="/admin/logistics/regions/states" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Estados
          </a>
          <span>/</span>
          <span className="text-gray-900 font-medium">{stateName || stateUf || 'Todas'}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Cidades Atendidas
        </h1>
        <p className="text-gray-600">
          Gerencie quais cidades possuem entrega. 
          {stateUf ? ` Estado: ${stateName || stateUf}.` : ' Mostrando todas as cidades.'}
        </p>
      </div>

      {/* AÇÕES: Busca + Botão Adicionar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Cidade
        </Button>
      </div>

      {/* LISTA DE CIDADES */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Cabeçalho */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
          <div className="col-span-3">Cidade</div>
          <div className="col-span-2 text-center">Bairros</div>
          <div className="col-span-4">Métodos de Entrega</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>

        {/* Corpo */}
        <div className="divide-y divide-gray-200">
          {cities.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhuma cidade encontrada</p>
              <p className="text-sm">Adicione uma cidade ou ajuste sua busca</p>
            </div>
          ) : (
            cities.map((city) => (
              <div 
                key={city.id}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors"
              >
                {/* Cidade */}
                <div className="col-span-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 text-green-700">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{city.name}</p>
                      <p className="text-xs text-gray-500">
                        {city.stateUf} • {city.createdAt.toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bairros */}
                <div className="col-span-2 text-center">
                  {city.neighborhoodsCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      <MapPin className="h-3 w-3" />
                      {city.neighborhoodsCount} bairros
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">Cidade toda</span>
                  )}
                </div>

                {/* Métodos */}
                <div className="col-span-4">
                  {city.availableMethods.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {city.availableMethods.map((method) => (
                        <span 
                          key={method}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          {methodLabels[method] || method}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Nenhum método</span>
                  )}
                </div>

                {/* Status */}
                <div className="col-span-1 text-center">
                  <button
                    onClick={() => toggleCity(city.id)}
                    className="focus:outline-none"
                    title={city.isActive ? 'Desativar' : 'Ativar'}
                  >
                    {city.isActive ? (
                      <ToggleRight className="h-8 w-8 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-gray-300" />
                    )}
                  </button>
                </div>

                {/* Ações */}
                <div className="col-span-2 text-right">
                  {city.neighborhoodsCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    >
                      Bairros
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Contador */}
      <div className="mt-4 text-sm text-gray-500 text-right">
        {cities.length} {cities.length === 1 ? 'cidade' : 'cidades'}
      </div>

      {/* Modal simplificado */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold mb-4">Adicionar Cidade</h2>
            <p className="text-gray-600 mb-4">
              Funcionalidade em desenvolvimento.
            </p>
            <Button onClick={() => setIsAddModalOpen(false)} className="w-full">
              Fechar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}