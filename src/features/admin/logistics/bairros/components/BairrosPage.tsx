/**
 * PÁGINA DE BAIRROS - Controle de entregas por região
 * 
 * Lista bairros com faixas de CEP e slots de dia/horário.
 * Usado apenas para entrega própria (controle total).
 */

'use client';

import { useState } from 'react';
import { 
  Search, 
  Plus, 
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Navigation,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBairros } from '../hooks/useBairros';

interface BairrosPageProps {
  cidadeFiltro?: string;
  estadoUfFiltro?: string;
}

export function BairrosPage({ cidadeFiltro, estadoUfFiltro }: BairrosPageProps) {
  // Hook que gerencia bairros
  const { 
    bairros, 
    searchTerm, 
    setSearchTerm,
    toggleBairro,
    toggleSlot,
    DIAS_SEMANA
  } = useBairros(cidadeFiltro, estadoUfFiltro);

  // Controla qual bairro está expandido (mostrando slots)
  const [bairroExpandido, setBairroExpandido] = useState<string | null>(null);

  // Controla modal de adicionar
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  /**
   * Expande ou recolhe bairro para ver slots
   */
  const toggleExpand = (id: string) => {
    setBairroExpandido(bairroExpandido === id ? null : id);
  };

  /**
   * Formata preço para exibição
   */
  const formatarPreco = (valor: number) => {
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
  };

  /**
   * Ícone do dia da semana
   */
  const getDiaIcon = (diaSemana: number) => {
    const cores = [
      'bg-red-100 text-red-700',      // Dom
      'bg-blue-100 text-blue-700',    // Seg
      'bg-green-100 text-green-700',  // Ter
      'bg-yellow-100 text-yellow-700',// Qua
      'bg-purple-100 text-purple-700',// Qui
      'bg-pink-100 text-pink-700',    // Sex
      'bg-orange-100 text-orange-700',// Sáb
    ];
    return cores[diaSemana] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* CABEÇALHO */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span className="text-gray-900 font-medium">Bairros e Rotas de Entrega</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {cidadeFiltro ? `Bairros - ${cidadeFiltro}` : 'Bairros Atendidos'}
        </h1>
        <p className="text-gray-600">
          Configure faixas de CEP e horários de entrega para cada bairro. 
          Clientes verão apenas os slots disponíveis para sua região.
        </p>
      </div>

      {/* AÇÕES: Busca + Botão Adicionar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar bairro ou faixa de CEP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Bairro
        </Button>
      </div>

      {/* LISTA DE BAIRROS */}
      <div className="space-y-4">
        {bairros.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Nenhum bairro encontrado</p>
            <p className="text-sm">Cadastre bairros para controlar rotas de entrega</p>
          </div>
        ) : (
          bairros.map((bairro) => (
            <div 
              key={bairro.id}
              className={`
                bg-white rounded-lg border-2 overflow-hidden transition-all
                ${bairro.isActive ? 'border-gray-200' : 'border-gray-100 opacity-75'}
              `}
            >
              {/* CABEÇALHO DO BAIRRO */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Ícone e nome */}
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{bairro.nome}</h3>
                      <p className="text-xs text-gray-500">
                        {bairro.cidade}, {bairro.estadoUf}
                      </p>
                    </div>
                  </div>

                  {/* Faixa de CEP */}
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm">
                    <Navigation className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-700">{bairro.faixaCep.display}</span>
                  </div>

                  {/* Badge de slots */}
                  {bairro.hasSlotsActive ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      {bairro.slots.filter((s) => s.isActive).length} slots ativos
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                      Sem slots
                    </span>
                  )}
                </div>

                {/* AÇÕES */}
                <div className="flex items-center gap-2">
                  {/* Toggle ativar/desativar */}
                  <button
                    onClick={() => toggleBairro(bairro.id)}
                    className="focus:outline-none"
                    title={bairro.isActive ? 'Desativar bairro' : 'Ativar bairro'}
                  >
                    {bairro.isActive ? (
                      <ToggleRight className="h-8 w-8 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-gray-300" />
                    )}
                  </button>

                  {/* Expandir/recolher */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(bairro.id)}
                  >
                    {bairroExpandido === bairro.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* SLOTS DE ENTREGA (expandido) */}
              {bairroExpandido === bairro.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Slots de Entrega Disponíveis
                  </h4>

                  {bairro.slots.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">
                      Nenhum slot configurado. Adicione horários de entrega.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {bairro.slots.map((slot) => (
                        <div
                          key={slot.id}
                          className={`
                            p-3 rounded-lg border transition-all
                            ${slot.isActive 
                              ? 'bg-white border-gray-200' 
                              : 'bg-gray-100 border-gray-200 opacity-60'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`
                              text-xs font-medium px-2 py-1 rounded
                              ${getDiaIcon(slot.diaSemana)}
                            `}>
                              {slot.diaNome}
                            </span>
                            <button
                              onClick={() => toggleSlot(bairro.id, slot.id)}
                              className="focus:outline-none"
                            >
                              {slot.isActive ? (
                                <ToggleRight className="h-5 w-5 text-green-500" />
                              ) : (
                                <ToggleLeft className="h-5 w-5 text-gray-300" />
                              )}
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Clock className="h-3 w-3" />
                            {slot.horarioInicio} às {slot.horarioFim}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                            <DollarSign className="h-3 w-3" />
                            {formatarPreco(slot.preco)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ações do bairro */}
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Editar Bairro
                    </Button>
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      Adicionar Slot
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Contador */}
      <div className="mt-6 text-sm text-gray-500 text-right">
        {bairros.length} {bairros.length === 1 ? 'bairro' : 'bairros'}
      </div>

      {/* Modal simplificado */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold mb-4">Novo Bairro</h2>
            <p className="text-gray-600 mb-4">
              Funcionalidade em desenvolvimento. Configure no código por enquanto.
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