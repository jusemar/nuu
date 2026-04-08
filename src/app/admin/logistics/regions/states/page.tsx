/**
 * PÁGINA DE ESTADOS - Regiões de Atendimento
 * 
 * Lista todos os estados atendidos com opções de:
 * - Buscar por nome ou UF
 * - Adicionar novo estado
 * - Ativar/desativar atendimento
 * - Ver quantidade de cidades cadastradas
 */

'use client';

import { useState } from 'react';
import { 
  Search, 
  Plus, 
  MapPin, 
  ChevronRight,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStates } from '../../../../../features/admin/logistics/regions/states/hooks/useStates';

export default function StatesPage() {
  // Hook que gerencia estados e busca
  const { 
    states, 
    searchTerm, 
    setSearchTerm, 
    toggleState 
  } = useStates();

  // Controla modal de adicionar estado (simplificado por enquanto)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* CABEÇALHO */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Estados Atendidos</h1>
        <p className="text-gray-600">
          Gerencie quais estados sua loja realiza entregas. 
          Clique em um estado para gerenciar suas cidades.
        </p>
      </div>

      {/* AÇÕES: Busca + Botão Adicionar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Campo de busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por nome ou UF (ex: SP, São Paulo)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Botão adicionar estado */}
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Estado
        </Button>
      </div>

      {/* LISTA DE ESTADOS */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Cabeçalho da tabela */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
          <div className="col-span-2">UF</div>
          <div className="col-span-4">Nome</div>
          <div className="col-span-2 text-center">Cidades</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>

        {/* Corpo da lista */}
        <div className="divide-y divide-gray-200">
          {states.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum estado encontrado</p>
              <p className="text-sm">Tente ajustar sua busca ou adicione um novo estado</p>
            </div>
          ) : (
            states.map((state) => (
              <div 
                key={state.uf}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors"
              >
                {/* UF */}
                <div className="col-span-2">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm">
                    {state.uf}
                  </span>
                </div>

                {/* Nome */}
                <div className="col-span-4">
                  <p className="font-medium text-gray-900">{state.name}</p>
                  <p className="text-xs text-gray-500">
                    Adicionado em {state.createdAt.toLocaleDateString('pt-BR')}
                  </p>
                </div>

                {/* Cidades */}
                <div className="col-span-2 text-center">
                  <span className={`text-sm ${state.citiesCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                    {state.citiesCount} {state.citiesCount === 1 ? 'cidade' : 'cidades'}
                  </span>
                </div>

                {/* Status (Toggle) */}
                <div className="col-span-2 text-center">
                  <button
                    onClick={() => toggleState(state.uf)}
                    className="inline-flex items-center justify-center focus:outline-none"
                    title={state.isActive ? 'Desativar atendimento' : 'Ativar atendimento'}
                  >
                    {state.isActive ? (
                      <ToggleRight className="h-8 w-8 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-gray-300" />
                    )}
                  </button>
                  <p className="text-xs mt-1 text-gray-500">
                    {state.isActive ? 'Ativo' : 'Inativo'}
                  </p>
                </div>

                {/* Ações */}
                <div className="col-span-2 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    asChild
                  >
                    <a href={`/admin/logistics/regions/cities?state=${state.uf}`}>
                      Cidades
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </a>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="mt-4 text-sm text-gray-500 text-right">
        {states.length} {states.length === 1 ? 'estado encontrado' : 'estados encontrados'}
      </div>

      {/* TODO: Modal de adicionar estado (próxima etapa) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold mb-4">Adicionar Estado</h2>
            <p className="text-gray-600 mb-4">
              Funcionalidade em desenvolvimento. Por enquanto use os dados mockados.
            </p>
            <Button 
              onClick={() => setIsAddModalOpen(false)}
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}