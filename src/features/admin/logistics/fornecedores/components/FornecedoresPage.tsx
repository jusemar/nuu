/**
 * PÁGINA DE FORNECEDORES
 * 
 * Lista todos os fornecedores com:
 * - Busca por nome/descrição
 * - Filtro por tipo (próprio, fornecedor, transportadora)
 * - Toggle ativar/desativar
 * - Cards com detalhes de entrega
 */

'use client';

import { useState } from 'react';
import { 
  Search, 
  Plus, 
  Store,
  Truck,
  Package,
  ToggleLeft,
  ToggleRight,
  Edit,
  Trash2,
  Filter,
  MapPin,
  Clock,
  DollarSign,
  Box
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFornecedores } from '../hooks/useFornecedores';
import type { TipoFornecedor } from '../types/fornecedores';

/**
 * Ícones por tipo de fornecedor
 */
const iconesPorTipo: Record<TipoFornecedor, React.ElementType> = {
  proprio: Store,
  fornecedor: Package,
  transportadora: Truck,
};

/**
 * Labels por tipo
 */
const labelsPorTipo: Record<TipoFornecedor, string> = {
  proprio: 'Próprio',
  fornecedor: 'Fornecedor',
  transportadora: 'Transportadora',
};

/**
 * Cores por tipo
 */
const coresPorTipo: Record<TipoFornecedor, string> = {
  proprio: 'bg-green-100 text-green-700',
  fornecedor: 'bg-blue-100 text-blue-700',
  transportadora: 'bg-orange-100 text-orange-700',
};

export function FornecedoresPage() {
  // Hook que gerencia fornecedores
  const { 
    fornecedores, 
    searchTerm, 
    setSearchTerm,
    filtroTipo,
    setFiltroTipo,
    toggleFornecedor 
  } = useFornecedores();

  // Controla modal de adicionar
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filtros de tipo disponíveis
  const filtrosTipo: Array<{ valor: TipoFornecedor | 'todos'; label: string }> = [
    { valor: 'todos', label: 'Todos' },
    { valor: 'proprio', label: 'Próprio' },
    { valor: 'fornecedor', label: 'Fornecedor' },
    { valor: 'transportadora', label: 'Transportadora' },
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

  /**
   * Formata regiões para exibição
   */
  const formatarRegioes = (regioes: string[]) => {
    if (regioes.length === 0) return 'Nenhuma região';
    if (regioes.length === 27) return 'Todo Brasil';
    if (regioes.length <= 3) return regioes.join(', ');
    return `${regioes.slice(0, 3).join(', ')} +${regioes.length - 3}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* CABEÇALHO */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Fornecedores
        </h1>
        <p className="text-gray-600">
          Gerencie quem entrega seus produtos: loja própria, fornecedores ou transportadoras parceiras.
        </p>
      </div>

      {/* AÇÕES: Busca + Filtros + Botão Adicionar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar fornecedor..."
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
          Novo Fornecedor
        </Button>
      </div>

      {/* LISTA DE FORNECEDORES - GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {fornecedores.length === 0 ? (
          <div className="col-span-full p-12 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
            <Store className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Nenhum fornecedor encontrado</p>
            <p className="text-sm">Ajuste seus filtros ou crie um novo fornecedor</p>
          </div>
        ) : (
          fornecedores.map((fornecedor) => {
            const Icone = iconesPorTipo[fornecedor.tipo];
            
            return (
              <div 
                key={fornecedor.id}
                className={`
                  bg-white rounded-lg border-2 overflow-hidden transition-all
                  ${fornecedor.isActive 
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
                        ${coresPorTipo[fornecedor.tipo]}
                      `}>
                        <Icone className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{fornecedor.nome}</h3>
                        <span className="text-xs text-gray-500">
                          {labelsPorTipo[fornecedor.tipo]}
                        </span>
                      </div>
                    </div>
                    
                    {/* Toggle ativar/desativar */}
                    <button
                      onClick={() => toggleFornecedor(fornecedor.id)}
                      className="focus:outline-none"
                      title={fornecedor.isActive ? 'Desativar' : 'Ativar'}
                    >
                      {fornecedor.isActive ? (
                        <ToggleRight className="h-8 w-8 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-gray-300" />
                      )}
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {fornecedor.descricao}
                  </p>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-2 gap-4 p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Box className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Produtos</p>
                      <p className="font-medium text-gray-900">{fornecedor.produtosVinculados}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Regiões</p>
                      <p className="font-medium text-gray-900 text-sm truncate" title={fornecedor.regioesAtendidas.join(', ')}>
                        {formatarRegioes(fornecedor.regioesAtendidas)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detalhes de entrega */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Prazo:</span>
                    <span className="font-medium text-gray-900">
                      {formatarPrazo(fornecedor.configuracao.prazoMin, fornecedor.configuracao.prazoMax)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Frete:</span>
                    <span className="font-medium text-gray-900">
                      {formatarPreco(fornecedor.configuracao.freteFixo)}
                    </span>
                    {fornecedor.configuracao.freteGratisAcima && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        Grátis acima de {formatarPreco(fornecedor.configuracao.freteGratisAcima)}
                      </span>
                    )}
                  </div>

                  {fornecedor.configuracao.horarioCorte && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-orange-400" />
                      <span className="text-gray-600">Corte:</span>
                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                        Até {fornecedor.configuracao.horarioCorte}
                      </span>
                    </div>
                  )}
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
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    Produtos
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
        {fornecedores.length} {fornecedores.length === 1 ? 'fornecedor' : 'fornecedores'}
      </div>

      {/* Modal simplificado de adicionar */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold mb-4">Novo Fornecedor</h2>
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