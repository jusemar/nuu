/**
 * PÁGINA DE FRETE - Sistema de 3 Níveis
 *
 * ⚠️ FUNCIONALIDADE VÁLIDA APENAS PARA ENTREGA PRÓPRIA
 *
 * Gerencia regiões, bairros avulsos e CEPs específicos para precificação de frete.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  MapPin,
  Home,
  AlertCircle,
  Loader2,
  TestTube,
  X,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useShipping } from "../hooks/useShipping";
import { Switch } from "@/components/ui/switch";
import { TimeSlotEditor } from "./TimeSlotEditor";

function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export function ShippingPage() {
  const {
    allRegions,
    regions,
    bairrosAvulsos,
    cepsEspecificos,
    isLoading,
    searchTerm,
    setSearchTerm,
    shippingTestResult,
    loadShippingData,
    addRegion,
    addBairroAvulso,
    addCepEspecifico,
    updateRegioData,
    updateBairroData,
    updateCepData,
    toggleRegioStatus,
    removeRegion,
    toggleBairroStatus,
    removeBairro,
    toggleCepStatus,
    removeCep,
    testShipping,
    clearShippingTest,
    weekDays,
    estadosAtivos,
    cidadesAtivas,
    carregarCidadesPorEstado,
  } = useShipping();

  const [activeTab, setActiveTab] = useState<
    "regioes" | "bairros" | "ceps" | "teste"
  >("regioes");

  // Modais
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [isBairroModalOpen, setIsBairroModalOpen] = useState(false);
  const [isCepModalOpen, setIsCepModalOpen] = useState(false);
  const [editingRegionId, setEditingRegionId] = useState<string | null>(null);
  const [editingBairroId, setEditingBairroId] = useState<string | null>(null);
  const [editingCepId, setEditingCepId] = useState<string | null>(null);
  const [testCepInput, setTestCepInput] = useState("");
  const [testNeighborhood, setTestNeighborhood] = useState("");
  const [testCity, setTestCity] = useState("");
  const [testState, setTestState] = useState("");

  // Estados de formulários
  const [regionForm, setRegionForm] = useState({
    name: "",
    description: "",
    city: "",
    state: "",
    baseShippingPrice: 0,
    bairros: [] as string[],
    slots: [] as Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>,
  });

  const [bairroForm, setBairroForm] = useState({
    neighborhood: "",
    city: "",
    state: "",
    baseShippingPrice: 0,
    slots: [] as Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>,
  });

  const [cepForm, setCepForm] = useState({
    cep: "",
    neighborhood: "",
    city: "",
    state: "",
    shippingPrice: 0,
  });

  useEffect(() => {
    loadShippingData();
  }, [loadShippingData]);

  const handleTestShipping = async () => {
    if (
      testCepInput.replace(/\D/g, "").length === 8 &&
      testNeighborhood &&
      testCity &&
      testState
    ) {
      await testShipping(testCepInput, testNeighborhood, testCity, testState);
    }
  };

  // RESET FORMS
  const resetRegionForm = useCallback(() => {
    setRegionForm({
      name: "",
      description: "",
      city: "",
      state: "",
      baseShippingPrice: 0,
      bairros: [],
      slots: [],
    });
    setEditingRegionId(null);
  }, []);

  const resetBairroForm = useCallback(() => {
    setBairroForm({
      neighborhood: "",
      city: "",
      state: "",
      baseShippingPrice: 0,
      slots: [],
    });
    setEditingBairroId(null);
  }, []);

  const resetCepForm = useCallback(() => {
    setCepForm({
      cep: "",
      neighborhood: "",
      city: "",
      state: "",
      shippingPrice: 0,
    });
    setEditingCepId(null);
  }, []);

  // OPEN EDIT MODALS
  const openEditRegion = useCallback(
    (id: string) => {
      const region = allRegions.find((r) => r.id === parseInt(id));
      if (!region) return;

      setRegionForm({
        name: region.name,
        description: region.description || "",
        city: region.city,
        state: region.state,
        baseShippingPrice: region.baseShippingPrice / 100,
        bairros: region.bairros?.map((b) => b.neighborhood) || [],
        slots:
          region.slots?.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
          })) || [],
      });
      setEditingRegionId(id);
      setIsRegionModalOpen(true);
    },
    [allRegions],
  );

  const openEditBairro = useCallback(
    (id: string) => {
      const bairro = bairrosAvulsos.find((b) => b.id === parseInt(id));
      if (!bairro) return;

      setBairroForm({
        neighborhood: bairro.neighborhood,
        city: bairro.city,
        state: bairro.state,
        baseShippingPrice: bairro.baseShippingPrice / 100,
        slots:
          bairro.slots?.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
          })) || [],
      });
      setEditingBairroId(id);
      setIsBairroModalOpen(true);
    },
    [bairrosAvulsos],
  );

  const openEditCep = useCallback(
    (id: string) => {
      const cep = cepsEspecificos.find((c) => c.id === parseInt(id));
      if (!cep) return;

      const formattedCep =
        cep.cep.length === 8
          ? `${cep.cep.slice(0, 5)}-${cep.cep.slice(5)}`
          : cep.cep;

      setCepForm({
        cep: formattedCep,
        neighborhood: cep.neighborhood,
        city: cep.city,
        state: cep.state,
        shippingPrice: cep.shippingPrice / 100,
      });
      setEditingCepId(id);
      setIsCepModalOpen(true);
    },
    [cepsEspecificos],
  );

  // SAVE HANDLERS
  const handleSaveRegion = useCallback(async () => {
    try {
      if (editingRegionId) {
        await updateRegioData(editingRegionId, {
          name: regionForm.name,
          description: regionForm.description,
          city: regionForm.city,
          state: regionForm.state.toUpperCase(),
          baseShippingPrice: Math.round(regionForm.baseShippingPrice * 100),
          bairros: regionForm.bairros.filter((b) => b.trim()),
          slots: regionForm.slots,
        });
      } else {
        await addRegion({
          name: regionForm.name,
          description: regionForm.description,
          city: regionForm.city,
          state: regionForm.state.toUpperCase(),
          baseShippingPrice: Math.round(regionForm.baseShippingPrice * 100),
          bairros: regionForm.bairros.filter((b) => b.trim()),
          slots: regionForm.slots,
        });
      }
      setIsRegionModalOpen(false);
      resetRegionForm();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao salvar região");
    }
  }, [
    editingRegionId,
    regionForm,
    addRegion,
    updateRegioData,
    resetRegionForm,
  ]);

  const handleSaveBairro = useCallback(async () => {
    try {
      if (editingBairroId) {
        await updateBairroData(editingBairroId, {
          neighborhood: bairroForm.neighborhood,
          city: bairroForm.city,
          state: bairroForm.state.toUpperCase(),
          baseShippingPrice: Math.round(bairroForm.baseShippingPrice * 100),
          slots: bairroForm.slots,
        });
      } else {
        await addBairroAvulso({
          neighborhood: bairroForm.neighborhood,
          city: bairroForm.city,
          state: bairroForm.state.toUpperCase(),
          baseShippingPrice: Math.round(bairroForm.baseShippingPrice * 100),
          slots: bairroForm.slots,
        });
      }
      setIsBairroModalOpen(false);
      resetBairroForm();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao salvar bairro");
    }
  }, [
    editingBairroId,
    bairroForm,
    addBairroAvulso,
    updateBairroData,
    resetBairroForm,
  ]);

  const handleSaveCep = useCallback(async () => {
    try {
      if (editingCepId) {
        await updateCepData(editingCepId, {
          shippingPrice: Math.round(cepForm.shippingPrice * 100),
        });
      } else {
        await addCepEspecifico({
          cep: cepForm.cep.replace(/\D/g, ""),
          neighborhood: cepForm.neighborhood,
          city: cepForm.city,
          state: cepForm.state.toUpperCase(),
          shippingPrice: Math.round(cepForm.shippingPrice * 100),
        });
      }
      setIsCepModalOpen(false);
      resetCepForm();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao salvar CEP");
    }
  }, [editingCepId, cepForm, addCepEspecifico, updateCepData, resetCepForm]);

  const addBairroToRegion = () => {
    setRegionForm((prev) => ({
      ...prev,
      bairros: [...prev.bairros, ""],
    }));
  };

  const updateBairroInRegion = (index: number, value: string) => {
    setRegionForm((prev) => ({
      ...prev,
      bairros: prev.bairros.map((b, i) => (i === index ? value : b)),
    }));
  };

  const removeBairroFromRegion = (index: number) => {
    setRegionForm((prev) => ({
      ...prev,
      bairros: prev.bairros.filter((_, i) => i !== index),
    }));
  };

  const addSlotToRegion = () => {
    setRegionForm((prev) => ({
      ...prev,
      slots: [
        ...prev.slots,
        { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
      ],
    }));
  };

  const addWeekdaysToRegion = (
    range: "weekdays" | "mon-sat" | "all" | "weekend",
  ) => {
    const ranges: Record<
      string,
      Array<{ dayOfWeek: number; startTime: string; endTime: string }>
    > = {
      weekdays: [1, 2, 3, 4, 5].map((day) => ({
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
      })),
      "mon-sat": [1, 2, 3, 4, 5, 6].map((day) => ({
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
      })),
      all: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
      })),
      weekend: [0, 6].map((day) => ({
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
      })),
    };

    const selectedRange = ranges[range];
    if (selectedRange) {
      setRegionForm((prev) => ({
        ...prev,
        slots: [...prev.slots, ...selectedRange],
      }));
    }
  };

  const updateSlotInRegion = (index: number, field: string, value: any) => {
    setRegionForm((prev) => ({
      ...prev,
      slots: prev.slots.map((s, i) =>
        i === index ? { ...s, [field]: value } : s,
      ),
    }));
  };

  const removeSlotFromRegion = (index: number) => {
    setRegionForm((prev) => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index),
    }));
  };

  const addSlotToBairro = () => {
    setBairroForm((prev) => ({
      ...prev,
      slots: [
        ...prev.slots,
        { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
      ],
    }));
  };

  const addWeekdaysToBairro = (
    range: "weekdays" | "mon-sat" | "all" | "weekend",
  ) => {
    const ranges: Record<
      string,
      Array<{ dayOfWeek: number; startTime: string; endTime: string }>
    > = {
      weekdays: [1, 2, 3, 4, 5].map((day) => ({
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
      })),
      "mon-sat": [1, 2, 3, 4, 5, 6].map((day) => ({
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
      })),
      all: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
      })),
      weekend: [0, 6].map((day) => ({
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
      })),
    };

    const selectedRange = ranges[range];
    if (selectedRange) {
      setBairroForm((prev) => ({
        ...prev,
        slots: [...prev.slots, ...selectedRange],
      }));
    }
  };

  const updateSlotInBairro = (index: number, field: string, value: any) => {
    setBairroForm((prev) => ({
      ...prev,
      slots: prev.slots.map((s, i) =>
        i === index ? { ...s, [field]: value } : s,
      ),
    }));
  };

  const removeSlotFromBairro = (index: number) => {
    setBairroForm((prev) => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* CABEÇALHO */}
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Frete Próprio - Sistema 3 Níveis
        </h1>
        <p className="text-gray-600">
          Gerencie regiões, bairros avulsos e CEPs específicos para precificação
          de entrega própria.
        </p>
      </div>

      {/* TABS */}
      <div className="mb-6 flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("regioes")}
          className={`border-b-2 px-4 py-2 font-medium transition ${
            activeTab === "regioes"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <MapPin className="mr-2 inline h-4 w-4" />
          Regiões ({regions.length})
        </button>

        <button
          onClick={() => setActiveTab("bairros")}
          className={`border-b-2 px-4 py-2 font-medium transition ${
            activeTab === "bairros"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Home className="mr-2 inline h-4 w-4" />
          Bairros Avulsos ({bairrosAvulsos.length})
        </button>

        <button
          onClick={() => setActiveTab("ceps")}
          className={`border-b-2 px-4 py-2 font-medium transition ${
            activeTab === "ceps"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <AlertCircle className="mr-2 inline h-4 w-4" />
          CEPs Específicos ({cepsEspecificos.length})
        </button>

        <button
          onClick={() => setActiveTab("teste")}
          className={`border-b-2 px-4 py-2 font-medium transition ${
            activeTab === "teste"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <TestTube className="mr-2 inline h-4 w-4" />
          Testar Frete
        </button>
      </div>

      {/* AÇÕES GERAIS */}
      {activeTab !== "teste" && (
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button
            onClick={() =>
              activeTab === "regioes"
                ? setIsRegionModalOpen(true)
                : activeTab === "bairros"
                  ? setIsBairroModalOpen(true)
                  : setIsCepModalOpen(true)
            }
            className="shrink-0 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            {activeTab === "regioes"
              ? "Nova Região"
              : activeTab === "bairros"
                ? "Novo Bairro"
                : "Novo CEP"}
          </Button>
        </div>
      )}

      {/* CONTEÚDO POR TAB */}

      {activeTab === "regioes" && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">
              <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
              <p>Carregando regiões...</p>
            </div>
          ) : regions.length === 0 ? (
            <div className="rounded-lg border bg-white p-12 text-center text-gray-500">
              <MapPin className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="font-medium">Nenhuma região cadastrada</p>
            </div>
          ) : (
            regions.map((region) => (
              <div key={region.id} className="rounded-lg border bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {region.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {region.city} - {region.state} •{" "}
                      {region.bairros?.length || 0} bairros
                    </p>
                    <p className="mt-1 text-sm font-medium text-blue-600">
                      Preço: {formatPrice(region.baseShippingPrice)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRegioStatus(region.id.toString())}
                    >
                      {region.isActive ? (
                        <ToggleRight className="h-6 w-6 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-gray-300" />
                      )}
                    </button>

                    <button
                      onClick={() => openEditRegion(region.id.toString())}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => removeRegion(region.id.toString())}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "bairros" && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">
              <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
              <p>Carregando bairros...</p>
            </div>
          ) : bairrosAvulsos.length === 0 ? (
            <div className="rounded-lg border bg-white p-12 text-center text-gray-500">
              <Home className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="font-medium">Nenhum bairro avulso cadastrado</p>
            </div>
          ) : (
            bairrosAvulsos.map((bairro) => (
              <div key={bairro.id} className="rounded-lg border bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {bairro.neighborhood}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {bairro.city} - {bairro.state}
                    </p>
                    <p className="mt-1 text-sm font-medium text-blue-600">
                      Preço: {formatPrice(bairro.baseShippingPrice)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleBairroStatus(bairro.id.toString())}
                    >
                      {bairro.isActive ? (
                        <ToggleRight className="h-6 w-6 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-gray-300" />
                      )}
                    </button>

                    <button
                      onClick={() => openEditBairro(bairro.id.toString())}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => removeBairro(bairro.id.toString())}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "ceps" && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">
              <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
              <p>Carregando CEPs...</p>
            </div>
          ) : cepsEspecificos.length === 0 ? (
            <div className="rounded-lg border bg-white p-12 text-center text-gray-500">
              <AlertCircle className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="font-medium">Nenhum CEP específico cadastrado</p>
            </div>
          ) : (
            cepsEspecificos.map((cep) => (
              <div key={cep.id} className="rounded-lg border bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {cep.cep.slice(0, 5)}-{cep.cep.slice(5)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {cep.neighborhood}, {cep.city} - {cep.state}
                    </p>
                    <p className="mt-1 text-sm font-medium text-blue-600">
                      Preço: {formatPrice(cep.shippingPrice)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleCepStatus(cep.id.toString())}>
                      {cep.isActive ? (
                        <ToggleRight className="h-6 w-6 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-gray-300" />
                      )}
                    </button>

                    <button
                      onClick={() => openEditCep(cep.id.toString())}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => removeCep(cep.id.toString())}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "teste" && (
        <div className="max-w-2xl">
          <div className="space-y-4 rounded-lg border bg-white p-6">
            <h2 className="text-lg font-bold">Testar Cálculo de Frete</h2>

            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="CEP (00000-000)"
                value={testCepInput}
                onChange={(e) => setTestCepInput(e.target.value)}
                maxLength={9}
              />
              <Input
                placeholder="Bairro"
                value={testNeighborhood}
                onChange={(e) => setTestNeighborhood(e.target.value)}
              />
              <Input
                placeholder="Cidade"
                value={testCity}
                onChange={(e) => setTestCity(e.target.value)}
              />
              <Input
                placeholder="UF"
                value={testState}
                onChange={(e) => setTestState(e.target.value.toUpperCase())}
                maxLength={2}
              />
            </div>

            <Button
              onClick={handleTestShipping}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Testar Frete
            </Button>

            {shippingTestResult && (
              <div
                className={`rounded-lg border p-4 ${
                  shippingTestResult.found
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <p
                  className={`mb-2 text-sm font-medium ${
                    shippingTestResult.found ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {shippingTestResult.message}
                </p>

                {shippingTestResult.found && (
                  <div className="text-sm text-gray-700">
                    <p className="mb-2 font-semibold">
                      Nível: {shippingTestResult.level}
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatPrice(shippingTestResult.shippingPrice)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE REGIÃO */}
      <Dialog
        open={isRegionModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetRegionForm();
          }
          setIsRegionModalOpen(open);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRegionId ? "Editar Região" : "Nova Região"}
            </DialogTitle>
            <DialogDescription>
              {editingRegionId
                ? "Altere as informações da região de entrega."
                : "Preencha as informações da região de entrega."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="region-name">Nome da Região</Label>
                <Input
                  id="region-name"
                  placeholder="Ex: Zona Norte"
                  value={regionForm.name}
                  onChange={(e) =>
                    setRegionForm({ ...regionForm, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region-state">Estado</Label>
                <select
                  id="region-state"
                  value={regionForm.state}
                  onChange={(e) => {
                    const uf = e.target.value;
                    setRegionForm({ ...regionForm, state: uf, city: "" });
                    carregarCidadesPorEstado(uf);
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Selecione...</option>
                  {estadosAtivos.map((estado) => (
                    <option key={estado.uf} value={estado.uf}>
                      {estado.name} ({estado.uf})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="region-city">Cidade</Label>
                <select
                  id="region-city"
                  value={regionForm.city}
                  onChange={(e) =>
                    setRegionForm({ ...regionForm, city: e.target.value })
                  }
                  disabled={!regionForm.state}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Selecione...</option>
                  {cidadesAtivas.map((cidade) => (
                    <option key={cidade.id} value={cidade.name}>
                      {cidade.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="region-price">Preço do Frete (R$)</Label>
                <Input
                  id="region-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={regionForm.baseShippingPrice}
                  onChange={(e) =>
                    setRegionForm({
                      ...regionForm,
                      baseShippingPrice: parseFloat(e.target.value) || 0,
                    })
                  }
              />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetRegionForm();
                setIsRegionModalOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveRegion}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editingRegionId ? "Salvar Alterações" : "Criar Região"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE BAIRRO AVULSO */}
      <Dialog
        open={isBairroModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetBairroForm();
          }
          setIsBairroModalOpen(open);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingBairroId ? "Editar Bairro Avulso" : "Novo Bairro Avulso"}
            </DialogTitle>
            <DialogDescription>
              {editingBairroId
                ? "Altere as informações do bairro avulso."
                : "Preencha as informações do bairro avulso."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bairro-name">Nome do Bairro</Label>
                <Input
                  id="bairro-name"
                  placeholder="Ex: Centro"
                  value={bairroForm.neighborhood}
                  onChange={(e) =>
                    setBairroForm({
                      ...bairroForm,
                      neighborhood: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bairro-state">Estado</Label>
                <select
                  id="bairro-state"
                  value={bairroForm.state}
                  onChange={(e) => {
                    const uf = e.target.value;
                    setBairroForm({ ...bairroForm, state: uf, city: "" });
                    carregarCidadesPorEstado(uf);
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Selecione...</option>
                  {estadosAtivos.map((estado) => (
                    <option key={estado.uf} value={estado.uf}>
                      {estado.name} ({estado.uf})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bairro-city">Cidade</Label>
                <select
                  id="bairro-city"
                  value={bairroForm.city}
                  onChange={(e) =>
                    setBairroForm({ ...bairroForm, city: e.target.value })
                  }
                  disabled={!bairroForm.state}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Selecione...</option>
                  {cidadesAtivas.map((cidade) => (
                    <option key={cidade.id} value={cidade.name}>
                      {cidade.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bairro-price">Preço do Frete (R$)</Label>
                <Input
                  id="bairro-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={bairroForm.baseShippingPrice}
                  onChange={(e) =>
                    setBairroForm({
                      ...bairroForm,
                      baseShippingPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Horários de Entrega</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSlotToBairro}
                  >
                    <Plus className="mr-1 h-4 w-4" /> Adicionar
                  </Button>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        addWeekdaysToBairro(
                          e.target.value as
                            | "weekdays"
                            | "mon-sat"
                            | "all"
                            | "weekend",
                        );
                        e.target.value = "";
                      }
                    }}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="" disabled>
                      + Adicionar rápido
                    </option>
                    <option value="weekdays">Segunda a Sexta</option>
                    <option value="mon-sat">Segunda a Sábado</option>
                    <option value="all">Todos os dias</option>
                    <option value="weekend">Fim de semana</option>
                  </select>
                </div>
              </div>
              <TimeSlotEditor
                slots={bairroForm.slots}
                onUpdateSlot={updateSlotInBairro}
                onRemoveSlot={removeSlotFromBairro}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetBairroForm();
                setIsBairroModalOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveBairro}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editingBairroId ? "Salvar Alterações" : "Criar Bairro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CEP ESPECÍFICO */}
      <Dialog
        open={isCepModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetCepForm();
          }
          setIsCepModalOpen(open);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCepId ? "Editar CEP Específico" : "Novo CEP Específico"}
            </DialogTitle>
            <DialogDescription>
              {editingCepId
                ? "Altere as informações do CEP específico."
                : "Preencha as informações do CEP específico."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep-code">CEP</Label>
                <Input
                  id="cep-code"
                  placeholder="00000-000"
                  maxLength={9}
                  value={cepForm.cep}
                  disabled={!!editingCepId}
                  onChange={(e) =>
                    setCepForm({
                      ...cepForm,
                      cep: e.target.value
                        .replace(/\D/g, "")
                        .replace(/(\d{5})(\d)/, "$1-$2"),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cep-neighborhood">Bairro</Label>
                <Input
                  id="cep-neighborhood"
                  placeholder="Ex: Centro"
                  value={cepForm.neighborhood}
                  onChange={(e) =>
                    setCepForm({ ...cepForm, neighborhood: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep-city">Cidade</Label>
                <Input
                  id="cep-city"
                  placeholder="Ex: São Paulo"
                  value={cepForm.city}
                  onChange={(e) =>
                    setCepForm({ ...cepForm, city: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cep-state">Estado (UF)</Label>
                <Input
                  id="cep-state"
                  placeholder="Ex: SP"
                  maxLength={2}
                  value={cepForm.state}
                  onChange={(e) =>
                    setCepForm({
                      ...cepForm,
                      state: e.target.value.toUpperCase(),
                    })
                  }
                  />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep-neighborhood">Bairro</Label>
                <Input
                  id="cep-neighborhood"
                  placeholder="Ex: Centro"
                  value={cepForm.neighborhood}
                  onChange={(e) =>
                    setCepForm({ ...cepForm, neighborhood: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cep-state">Estado</Label>
                <select
                  id="cep-state"
                  value={cepForm.state}
                  onChange={(e) => {
                    const uf = e.target.value;
                    setCepForm({ ...cepForm, state: uf, city: "" });
                    carregarCidadesPorEstado(uf);
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Selecione...</option>
                  {estadosAtivos.map((estado) => (
                    <option key={estado.uf} value={estado.uf}>
                      {estado.name} ({estado.uf})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep-city">Cidade</Label>
                <select
                  id="cep-city"
                  value={cepForm.city}
                  onChange={(e) =>
                    setCepForm({ ...cepForm, city: e.target.value })
                  }
                  disabled={!cepForm.state}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Selecione...</option>
                  {cidadesAtivas.map((cidade) => (
                    <option key={cidade.id} value={cidade.name}>
                      {cidade.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cep-price">Preço do Frete (R$)</Label>
                <Input
                  id="cep-price"
                  type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={cepForm.shippingPrice}
                onChange={(e) =>
                  setCepForm({
                    ...cepForm,
                    shippingPrice: parseFloat(e.target.value) || 0,
                  })
                }
              />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetCepForm();
                setIsCepModalOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveCep}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editingCepId ? "Salvar Alterações" : "Criar CEP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
