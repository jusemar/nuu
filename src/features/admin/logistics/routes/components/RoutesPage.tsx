/**
 * PÁGINA DE ROTAS DE ENTREGA - Admin
 * 
 * Cadastra e gerencia rotas de entrega própria.
 * Usa ViaCEP para sugerir bairro/cidade/UF ao digitar CEP.
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  MapPin,
  Navigation,
  Clock,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Edit,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Loader2,
  TestTube
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRoutes } from '../hooks/useRoutes';

/**
 * Formata preço de centavos para reais
 */
function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

/**
 * Formata CEP (00000000 → 00000-000)
 */
function formatCep(cep: string): string {
  if (cep.length !== 8) return cep;
  return `${cep.slice(0, 5)}-${cep.slice(5)}`;
}

export function RoutesPage() {
  // Hook de rotas
  const {
    routes,
    isLoading,
    searchTerm,
    setSearchTerm,
    cepTestResult,
    bairroState,
    viaCepData,
    searchCep,
    confirmBairro,
    editBairro,
    resetBairro,
    loadRoutes,
    addRoute,
    toggleRouteStatus,
    removeRoute,
    testCepCoverage,
    clearCepTest,
    weekDays,
  } = useRoutes();

  // Carrega rotas ao montar
  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  // Controla modal de nova rota
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Controla modal de teste de CEP
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testCepInput, setTestCepInput] = useState('');

  // Estado do formulário de nova rota
  const [formData, setFormData] = useState({
    name: '',
    cepStart: '',
    cepEnd: '',
    registeredNeighborhood: '',
    city: '',
    state: '',
    slots: [] as Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      shippingPrice: number;
      isActive: boolean;
    }>,
  });

  /**
   * Manipula mudança no CEP inicial
   */
  const handleCepStartChange = async (value: string) => {
    const cleanCep = value.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, cepStart: cleanCep }));
    
    // Busca ViaCEP quando tem 8 dígitos
    if (cleanCep.length === 8) {
      await searchCep(cleanCep);
      
      // Se ViaCEP retornou dados, preenche cidade/estado/bairro
      if (viaCepData) {
        setFormData((prev) => ({
          ...prev,
          city: viaCepData.localidade,
          state: viaCepData.uf,
          registeredNeighborhood: viaCepData.bairro,
        }));
      }
    }
  };

  /**
   * Adiciona slot ao formulário
   */
  const addSlot = () => {
    setFormData((prev) => ({
      ...prev,
      slots: [
        ...prev.slots,
        {
          dayOfWeek: 1,
          startTime: '08:00',
          endTime: '13:00',
          shippingPrice: 1000,
          isActive: true,
        },
      ],
    }));
  };

  /**
   * Remove slot do formulário
   */
  const removeSlot = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index),
    }));
  };

  /**
   * Salva nova rota
   */
  const handleSave = async () => {
    try {
      await addRoute({
        name: formData.name,
        cepStart: formData.cepStart,
        cepEnd: formData.cepEnd,
        officialNeighborhood: viaCepData?.bairro || null,
        registeredNeighborhood: formData.registeredNeighborhood,
        city: formData.city,
        state: formData.state,
        slots: formData.slots,
      });
      
      // Fecha modal e reseta
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao salvar');
    }
  };

  /**
   * Reseta formulário
   */
  const resetForm = () => {
    setFormData({
      name: '',
      cepStart: '',
      cepEnd: '',
      registeredNeighborhood: '',
      city: '',
      state: '',
      slots: [],
    });
    resetBairro();
  };

  /**
   * Executa teste de CEP
   */
  const handleTestCep = async () => {
    if (testCepInput.replace(/\D/g, '').length === 8) {
      await testCepCoverage(testCepInput);
    }
  };

  /**
   * Renderiza estado do campo bairro
   */
  const renderBairroField = () => {
    switch (bairroState) {
      case 'idle':
        return (
          <Input
            placeholder="Digite o CEP inicial para buscar"
            value={formData.registeredNeighborhood}
            onChange={(e) => setFormData((prev) => ({ ...prev, registeredNeighborhood: e.target.value }))}
            disabled
          />
        );
        
      case 'loading':
        return (
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-gray-600">Buscando bairro...</span>
          </div>
        );
        
      case 'suggested':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Sugerido: <strong>{viaCepData?.bairro}</strong>
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-green-700 border-green-300 hover:bg-green-50"
                onClick={confirmBairro}
              >
                <Check className="h-4 w-4 mr-1" />
                Confirmar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-orange-700 border-orange-300 hover:bg-orange-50"
                onClick={editBairro}
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            </div>
          </div>
        );
        
      case 'confirmed':
        return (
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">
              <strong>{formData.registeredNeighborhood}</strong> (confirmado)
            </span>
          </div>
        );
        
      case 'manual':
      case 'error':
        return (
          <div className="space-y-2">
            {bairroState === 'error' && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  ViaCEP indisponível. Digite manualmente.
                </span>
              </div>
            )}
            <Input
              placeholder="Digite o nome do bairro"
              value={formData.registeredNeighborhood}
              onChange={(e) => setFormData((prev) => ({ ...prev, registeredNeighborhood: e.target.value }))}
              className={bairroState === 'error' ? 'border-yellow-400' : ''}
            />
          </div>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* CABEÇALHO */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Rotas de Entrega
        </h1>
        <p className="text-gray-600">
          Cadastre regiões de entrega própria com faixas de CEP, dias e horários.
        </p>
      </div>

      {/* AÇÕES */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar rota, bairro ou CEP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button
          variant="outline"
          onClick={() => setIsTestModalOpen(true)}
          className="shrink-0"
        >
          <TestTube className="h-4 w-4 mr-2" />
          Testar CEP
        </Button>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Rota
        </Button>
      </div>

      {/* LISTA DE ROTAS */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">
            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
            <p>Carregando rotas...</p>
          </div>
        ) : routes.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-white rounded-lg border">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Nenhuma rota cadastrada</p>
            <p className="text-sm">Crie sua primeira rota de entrega</p>
          </div>
        ) : (
          routes.map((route) => (
            <div
              key={route.id}
              className={`
                bg-white rounded-lg border-2 overflow-hidden
                ${route.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}
              `}
            >
              {/* Cabeçalho da rota */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700">
                    <Navigation className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{route.name}</h3>
                    <p className="text-sm text-gray-500">
                      {route.registeredNeighborhood}, {route.city} - {route.state}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Badge de faixa CEP */}
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    {route.cepStartDisplay} a {route.cepEndDisplay}
                  </span>

                  {/* Toggle ativar/desativar */}
                  <button
                    onClick={() => toggleRouteStatus(route.id)}
                    className="focus:outline-none"
                  >
                    {route.isActive ? (
                      <ToggleRight className="h-8 w-8 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Slots da rota */}
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-2">
                  {route.slots.map((slot) => (
                    <span
                      key={slot.id}
                      className={`
                        inline-flex items-center gap-1 px-2 py-1 rounded text-xs
                        ${slot.isActive
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-400'
                        }
                      `}
                    >
                      <Clock className="h-3 w-3" />
                      {slot.dayName}, {slot.startTime}-{slot.endTime}
                      <DollarSign className="h-3 w-3 ml-1" />
                      {formatPrice(slot.shippingPrice)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: Nova Rota */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Nova Rota de Entrega</h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Nome da rota */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da rota *
                  </label>
                  <Input
                    placeholder="Ex: Zona Sul — Jardins"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                {/* Faixa de CEP */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CEP Inicial *
                    </label>
                    <Input
                      placeholder="00000-000"
                      value={formData.cepStart}
                      onChange={(e) => handleCepStartChange(e.target.value)}
                      maxLength={9}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CEP Final *
                    </label>
                    <Input
                      placeholder="00000-000"
                      value={formData.cepEnd}
                      onChange={(e) => setFormData((prev) => ({ ...prev, cepEnd: e.target.value.replace(/\D/g, '') }))}
                      maxLength={9}
                    />
                  </div>
                </div>

                {/* Bairro (com ViaCEP) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bairro *
                  </label>
                  {renderBairroField()}
                </div>

                {/* Cidade e UF */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cidade
                    </label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                      readOnly={bairroState === 'confirmed'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      UF
                    </label>
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                      maxLength={2}
                      readOnly={bairroState === 'confirmed'}
                    />
                  </div>
                </div>

                {/* Slots de entrega */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Slots de Entrega *
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addSlot}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>

                  {formData.slots.length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      Adicione pelo menos um slot de entrega
                    </p>
                  )}

                  <div className="space-y-2">
                    {formData.slots.map((slot, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                      >
                        <select
                          value={slot.dayOfWeek}
                          onChange={(e) => {
                            const newSlots = [...formData.slots];
                            newSlots[index].dayOfWeek = Number(e.target.value);
                            setFormData((prev) => ({ ...prev, slots: newSlots }));
                          }}
                          className="text-sm border rounded px-2 py-1"
                        >
                          {weekDays.map((day) => (
                            <option key={day.id} value={day.id}>
                              {day.name}
                            </option>
                          ))}
                        </select>

                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => {
                            const newSlots = [...formData.slots];
                            newSlots[index].startTime = e.target.value;
                            setFormData((prev) => ({ ...prev, slots: newSlots }));
                          }}
                          className="w-24 text-sm"
                        />

                        <span className="text-gray-400">às</span>

                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => {
                            const newSlots = [...formData.slots];
                            newSlots[index].endTime = e.target.value;
                            setFormData((prev) => ({ ...prev, slots: newSlots }));
                          }}
                          className="w-24 text-sm"
                        />

                        <div className="relative">
                          <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                          <Input
                            type="number"
                            placeholder="Preço"
                            value={slot.shippingPrice / 100}
                            onChange={(e) => {
                              const newSlots = [...formData.slots];
                              newSlots[index].shippingPrice = Math.round(Number(e.target.value) * 100);
                              setFormData((prev) => ({ ...prev, slots: newSlots }));
                            }}
                            className="w-24 text-sm pl-6"
                          />
                        </div>

                        <button
                          onClick={() => removeSlot(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ações do modal */}
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={
                    !formData.name ||
                    !formData.cepStart ||
                    !formData.cepEnd ||
                    !formData.registeredNeighborhood ||
                    formData.slots.length === 0
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Salvar Rota
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Testar CEP */}
      {isTestModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Testar Cobertura de CEP</h2>
                <button
                  onClick={() => {
                    setIsTestModalOpen(false);
                    clearCepTest();
                    setTestCepInput('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Digite um CEP
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="00000-000"
                      value={testCepInput}
                      onChange={(e) => setTestCepInput(e.target.value)}
                      maxLength={9}
                    />
                    <Button onClick={handleTestCep}>
                      Testar
                    </Button>
                  </div>
                </div>

                {isLoading && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verificando...</span>
                  </div>
                )}

                {cepTestResult && (
                  <div className={`
                    p-4 rounded-lg
                    ${cepTestResult.found ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}
                  `}>
                    <p className={`
                      text-sm font-medium mb-2
                      ${cepTestResult.found ? 'text-green-800' : 'text-red-800'}
                    `}>
                      {cepTestResult.message}
                    </p>

                    {cepTestResult.found && cepTestResult.availableSlots && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600">Slots disponíveis:</p>
                        {cepTestResult.availableSlots.map((slot) => (
                          <div
                            key={slot.id}
                            className="flex items-center gap-2 text-sm text-green-700"
                          >
                            <Clock className="h-3 w-3" />
                            {slot.dayName}, {slot.startTime}-{slot.endTime}
                            <DollarSign className="h-3 w-3 ml-1" />
                            {formatPrice(slot.shippingPrice)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}