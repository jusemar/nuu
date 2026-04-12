/**
 * PÁGINA DE MODALIDADES DE ENTREGA
 * 
 * Lista todas as modalidades com:
 * - Busca por nome/descrição
 * - Filtro por tipo
 * - Toggle ativar/desativar
 * - Cards com detalhes de preço, prazo e regras
 */

'use client';

import { useState } from 'react';
import { 
  Search, 
  Plus, 
  Truck,
  Bike,
  Store,
  Package,
  Clock,
  Calendar,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Edit,
  Trash2,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useModalidadesEntrega } from '../hooks/useModalidadesEntrega';
import type { TipoModalidade } from '../types/modalidadesEntrega';

/**
 * Ícones por tipo de modalidade
 */
const iconesPorTipo: Record<TipoModalidade, React.ElementType> = {
  motoboy: Bike,
  transportadora: Truck,
  fornecedor: Package,
  retirada: Store,
};

/**
 * Labels por tipo de modalidade
 */
const labelsPorTipo: Record<TipoModalidade, string> = {
  motoboy: 'Motoboy',
  transportadora: 'Transportadora',
  fornecedor: 'Fornecedor',
  retirada: 'Retirada',
};

/**
 * Cores por tipo de modalidade
 */
const coresPorTipo: Record<TipoModalidade, string> = {
  motoboy: 'bg-orange-100 text-orange-700',
  transportadora: 'bg-blue-100 text-blue-700',
  fornecedor: 'bg-purple-100 text-purple-700',
  retirada: 'bg-green-100 text-green-700',
};

export function ModalidadesEntregaPage() {
  // Hook que gerencia modalidades
  const { 
    modalidades, 
    searchTerm, 
    setSearchTerm,
    filtroTipo,
    setFiltroTipo,
    toggleModalidade 
  } = useModalidadesEntrega();

  // Controla modal de adicionar
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filtros de tipo disponíveis
  const filtrosTipo: Array<{ valor: TipoModalidade | 'todos'; label: string }> = [
    { valor: 'todos', label: 'Todos' },
    { valor: 'motoboy', label: 'Motoboy' },
    { valor: 'transportadora', label: 'Transportadora' },
    { valor: 'fornecedor', label: 'Fornecedor' },
    { valor: 'retirada', label: 'Retirada' },
  ];

  /**
   * Formata preço para exibição
   */
  const formatarPreco = (valor?: number) => {
    if (valor === undefined || valor === null) return '-';
    if (valor === 0) return 'Grátis';
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
  };

  /**
   * Formata prazo para exibição
   */
  const formatarPrazo = (min: number, max: number) => {
    if (min === 0 && max === 0) return 'Hoje';
    if (min === max) return `${min} dias`;
    return `${min} a ${max} dias`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* CABEÇALHO */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Modalidades de Entrega
        </h1>
        <p className="text-gray-600">
          Configure como seus produtos serão entregues: motoboy, transportadora, 
          fornecedor ou retirada no local.
        </p>
      </div>

      {/* AÇÕES: Busca + Filtros + Botão Adicionar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar modalidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros de tipo */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
          <Filter className="h-4 w-4 text-gray-400 shrink-0" />
          {filtrosTipo.map((filtro) => (
            <button
              key={filtro.valor}
              onClick={() => setFiltroTipo(filtro.valor)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${filtroTipo === filtro.valor
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {filtro.label}
            </button>
          ))}
        </div>

        {/* Botão adicionar */}
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Modalidade
        </Button>
      </div>

      {/* LISTA DE MODALIDADES - GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {modalidades.length === 0 ? (
          <div className="col-span-full p-12 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
            <Truck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Nenhuma modalidade encontrada</p>
            <p className="text-sm">Ajuste seus filtros ou crie uma nova modalidade</p>
          </div>
        ) : (
          modalidades.map((modalidade) => {
            const Icone = iconesPorTipo[modalidade.tipo];
            
            return (
              <div 
                key={modalidade.id}
                className={`
                  bg-white rounded-lg border-2 overflow-hidden transition-all
                  ${modalidade.isActive 
                    ? 'border-gray-200 hover:border-blue-300' 
                    : 'border-gray-100 opacity-75'
                  }
                `}
              >
                {/* Cabeçalho do card */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`
                        inline-flex items-center justify-center w-10 h-10 rounded-lg
                        ${coresPorTipo[modalidade.tipo]}
                      `}>
                        <Icone className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{modalidade.nome}</h3>
                        <span className="text-xs text-gray-500">
                          {labelsPorTipo[modalidade.tipo]}
                        </span>
                      </div>
                    </div>
                    
                    {/* Toggle ativar/desativar */}
                    <button
                      onClick={() => toggleModalidade(modalidade.id)}
                      className="focus:outline-none"
                      title={modalidade.isActive ? 'Desativar' : 'Ativar'}
                    >
                      {modalidade.isActive ? (
                        <ToggleRight className="h-8 w-8 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-gray-300" />
                      )}
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {modalidade.descricao}
                  </p>
                </div>

                {/* Detalhes */}
                <div className="p-4 space-y-3">
                  {/* Preço */}
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Preço:</span>
                    <span className="font-medium text-gray-900">
                      {formatarPreco(modalidade.preco.fixo)}
                    </span>
                    {modalidade.preco.freteGratisAcima && (
                                            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        Grátis acima de {formatarPreco(modalidade.preco.freteGratisAcima)}
                      </span>
                    )}
                  </div>

                  {/* Prazo */}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Prazo:</span>
                    <span className="font-medium text-gray-900">
                      {formatarPrazo(modalidade.prazoDias.min, modalidade.prazoDias.max)}
                    </span>
                  </div>

                  {/* Agendamento */}
                  {modalidade.permiteAgendamento && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        Permite agendamento
                      </span>
                    </div>
                  )}

                  {/* Horário de corte */}
                  {modalidade.horariosCorte.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-orange-400" />
                      <span className="text-gray-600">Corte:</span>
                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                        Até {modalidade.horariosCorte[0].horario}
                      </span>
                    </div>
                  )}

                  {/* Restrições */}
                  <div className="pt-2 border-t border-gray-100 space-y-1">
                    {modalidade.pesoMaximo && (
                      <p className="text-xs text-gray-500">
                        Peso máx: {modalidade.pesoMaximo}kg
                      </p>
                    )}
                    {modalidade.dimensoesMaximas && (
                      <p className="text-xs text-gray-500">
                        Dimensões máx: {modalidade.dimensoesMaximas.comprimento}x
                        {modalidade.dimensoesMaximas.largura}x
                        {modalidade.dimensoesMaximas.altura}cm
                      </p>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="p-4 border-t border-gray-100 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
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
            );
          })
        )}
      </div>

      {/* Contador de resultados */}
      <div className="mt-6 text-sm text-gray-500 text-right">
        {modalidades.length} {modalidades.length === 1 ? 'modalidade' : 'modalidades'}
      </div>

      {/* Modal simplificado de adicionar */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold mb-4">Nova Modalidade</h2>
            <p className="text-gray-600 mb-4">
              Funcionalidade em desenvolvimento. Configure no código por enquanto.
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