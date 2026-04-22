/**
 * PÁGINA DE BAIRROS - Controle de entregas por região
 *
 * Lista bairros com faixas de CEP e slots de dia/horário.
 * Usado apenas para entrega própria (controle total).
 */

"use client";

import { useState, useEffect } from "react";
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
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  getBairros,
  createBairro,
  updateBairroStatus,
} from "../services/bairrosService";
import type { Bairro } from "../types/bairros";

interface BairrosPageProps {
  cidadeFiltro?: string;
  estadoUfFiltro?: string;
}

const DIAS_SEMANA = [
  { id: 0, nome: "Domingo" },
  { id: 1, nome: "Segunda-feira" },
  { id: 2, nome: "Terça-feira" },
  { id: 3, nome: "Quarta-feira" },
  { id: 4, nome: "Quinta-feira" },
  { id: 5, nome: "Sexta-feira" },
  { id: 6, nome: "Sábado" },
];

export function BairrosPage({
  cidadeFiltro,
  estadoUfFiltro,
}: BairrosPageProps) {
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newBairroNome, setNewBairroNome] = useState("");
  const [newBairroCepInicio, setNewBairroCepInicio] = useState("");
  const [newBairroCepFim, setNewBairroCepFim] = useState("");

  const [bairroExpandido, setBairroExpandido] = useState<string | null>(null);

  useEffect(() => {
    loadBairros();
  }, [cidadeFiltro, estadoUfFiltro]);

  async function loadBairros() {
    setIsLoading(true);
    try {
      const data = await getBairros(cidadeFiltro, estadoUfFiltro);
      setBairros(data);
    } catch (error) {
      console.error("Erro ao carregar bairros:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddBairro() {
    if (!newBairroNome || !cidadeFiltro || !estadoUfFiltro) return;

    setIsSubmitting(true);
    try {
      await createBairro({
        nome: newBairroNome,
        cidade: cidadeFiltro,
        estadoUf: estadoUfFiltro,
        faixaCep: {
          inicio: newBairroCepInicio,
          fim: newBairroCepFim,
          display: `${newBairroCepInicio.slice(0, 5)}-${newBairroCepInicio.slice(5)} a ${newBairroCepFim.slice(0, 5)}-${newBairroCepFim.slice(5)}`,
        },
        slots: [],
        hasSlotsActive: false,
        isActive: true,
      });
      setIsModalOpen(false);
      setNewBairroNome("");
      setNewBairroCepInicio("");
      setNewBairroCepFim("");
      loadBairros();
    } catch (error) {
      console.error("Erro ao criar bairro:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleBairro(id: string, currentStatus: boolean) {
    try {
      await updateBairroStatus(id, !currentStatus);
      loadBairros();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  }

  const toggleExpand = (id: string) => {
    setBairroExpandido(bairroExpandido === id ? null : id);
  };

  const filteredBairros = searchTerm
    ? bairros.filter(
        (b) =>
          b.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.faixaCep.display.includes(searchTerm),
      )
    : bairros;

  /**
   * Formata preço para exibição
   */
  const formatarPreco = (valor: number) => {
    return `R$ ${valor.toFixed(2).replace(".", ",")}`;
  };

  /**
   * Ícone do dia da semana
   */
  const getDiaIcon = (diaSemana: number) => {
    const cores = [
      "bg-red-100 text-red-700", // Dom
      "bg-blue-100 text-blue-700", // Seg
      "bg-green-100 text-green-700", // Ter
      "bg-yellow-100 text-yellow-700", // Qua
      "bg-purple-100 text-purple-700", // Qui
      "bg-pink-100 text-pink-700", // Sex
      "bg-orange-100 text-orange-700", // Sáb
    ];
    return cores[diaSemana] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* CABEÇALHO */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
          <span className="font-medium text-gray-900">
            Bairros e Rotas de Entrega
          </span>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          {cidadeFiltro ? `Bairros - ${cidadeFiltro}` : "Bairros Atendidos"}
        </h1>
        <p className="text-gray-600">
          Configure faixas de CEP e horários de entrega para cada bairro.
          Clientes verão apenas os slots disponíveis para sua região.
        </p>
      </div>

      {/* AÇÕES: Busca + Botão Adicionar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar bairro ou faixa de CEP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Novo Bairro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Bairro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="bairroNome">Nome do Bairro</Label>
                <Input
                  id="bairroNome"
                  value={newBairroNome}
                  onChange={(e) => setNewBairroNome(e.target.value)}
                  placeholder="Jardins"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="cepInicio">CEP Início</Label>
                <Input
                  id="cepInicio"
                  value={newBairroCepInicio}
                  onChange={(e) => setNewBairroCepInicio(e.target.value)}
                  placeholder="01400000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="cepFim">CEP Fim</Label>
                <Input
                  id="cepFim"
                  value={newBairroCepFim}
                  onChange={(e) => setNewBairroCepFim(e.target.value)}
                  placeholder="01599999"
                  className="mt-1"
                />
              </div>
              {cidadeFiltro && (
                <p className="text-sm text-gray-500">
                  Cidade: {cidadeFiltro} ({estadoUfFiltro})
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAddBairro}
                disabled={!newBairroNome || !cidadeFiltro || isSubmitting}
              >
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* LISTA DE BAIRROS */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-gray-500">
            <p>Carregando...</p>
          </div>
        ) : filteredBairros.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-gray-500">
            <MapPin className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="font-medium">Nenhum bairro encontrado</p>
            <p className="text-sm">
              Cadastre bairros para controlar rotas de entrega
            </p>
          </div>
        ) : (
          filteredBairros.map((bairro) => (
            <div
              key={bairro.id}
              className={`overflow-hidden rounded-lg border-2 bg-white transition-all ${bairro.isActive ? "border-gray-200" : "border-gray-100 opacity-75"} `}
            >
              {/* CABEÇALHO DO BAIRRO */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  {/* Ícone e nome */}
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {bairro.nome}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {bairro.cidade}, {bairro.estadoUf}
                      </p>
                    </div>
                  </div>

                  {/* Faixa de CEP */}
                  <div className="hidden items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm sm:flex">
                    <Navigation className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-700">
                      {bairro.faixaCep.display}
                    </span>
                  </div>

                  {/* Badge de slots */}
                  {bairro.hasSlotsActive ? (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                      {bairro.slots.filter((s) => s.isActive).length} slots
                      ativos
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                      Sem slots
                    </span>
                  )}
                </div>

                {/* AÇÕES */}
                <div className="flex items-center gap-2">
                  {/* Toggle ativar/desativar */}
                  <button
                    onClick={() =>
                      handleToggleBairro(bairro.id, bairro.isActive)
                    }
                    className="focus:outline-none"
                    title={
                      bairro.isActive ? "Desativar bairro" : "Ativar bairro"
                    }
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
                <div className="border-t border-gray-100 bg-gray-50 p-4">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Clock className="h-4 w-4" />
                    Slots de Entrega Disponíveis
                  </h4>

                  {bairro.slots.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">
                      Nenhum slot configurado. Adicione horários de entrega.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {bairro.slots.map((slot) => (
                        <div
                          key={slot.id}
                          className={`rounded-lg border p-3 transition-all ${
                            slot.isActive
                              ? "border-gray-200 bg-white"
                              : "border-gray-200 bg-gray-100 opacity-60"
                          } `}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span
                              className={`rounded px-2 py-1 text-xs font-medium ${getDiaIcon(slot.diaSemana)} `}
                            >
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

                          <div className="mb-1 flex items-center gap-2 text-sm text-gray-600">
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
                      <Edit className="mr-1 h-4 w-4" />
                      Editar Bairro
                    </Button>
                    <Button variant="outline" size="sm">
                      <Calendar className="mr-1 h-4 w-4" />
                      Adicionar Slot
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
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
      <div className="mt-6 text-right text-sm text-gray-500">
        {filteredBairros.length}{" "}
        {filteredBairros.length === 1 ? "bairro" : "bairros"}
      </div>
    </div>
  );
}
