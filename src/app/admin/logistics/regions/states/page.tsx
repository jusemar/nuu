/**
 * PÁGINA DE ESTADOS - Regiões de Atendimento
 *
 * Lista todos os estados atendidos com opções de:
 * - Buscar por nome ou UF
 * - Adicionar novo estado
 * - Ativar/desativar atendimento
 * - Ver quantidade de cidades cadastradas
 */

"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  MapPin,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  X,
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
  getStates,
  createState,
  updateStateStatus,
} from "../../../../../features/admin/logistics/regions/states/services/statesService";
import type { State } from "../../../../../features/admin/logistics/regions/states/types/states";

export default function StatesPage() {
  const [states, setStates] = useState<State[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStateUf, setNewStateUf] = useState("");
  const [newStateName, setNewStateName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadStates();
  }, []);

  async function loadStates() {
    setIsLoading(true);
    try {
      const data = await getStates();
      setStates(data);
    } catch (error) {
      console.error("Erro ao carregar estados:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddState() {
    if (!newStateUf || !newStateName) return;

    setIsSubmitting(true);
    try {
      await createState({
        uf: newStateUf.toUpperCase(),
        name: newStateName,
        isActive: true,
        citiesCount: 0,
      });
      setIsModalOpen(false);
      setNewStateUf("");
      setNewStateName("");
      loadStates();
    } catch (error) {
      console.error("Erro ao criar estado:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleState(uf: string, currentStatus: boolean) {
    try {
      await updateStateStatus(uf, !currentStatus);
      loadStates();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  }

  const filteredStates = searchTerm
    ? states.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.uf.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : states;

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* CABEÇALHO */}
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Estados Atendidos
        </h1>
        <p className="text-gray-600">
          Gerencie quais estados sua loja realiza entregas. Clique em um estado
          para gerenciar suas cidades.
        </p>
      </div>

      {/* AÇÕES: Busca + Botão Adicionar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        {/* Campo de busca */}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por nome ou UF (ex: SP, São Paulo)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Botão adicionar estado */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Estado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Estado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="uf">UF (sigla)</Label>
                <Input
                  id="uf"
                  value={newStateUf}
                  onChange={(e) => setNewStateUf(e.target.value)}
                  placeholder="SP"
                  maxLength={2}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={newStateName}
                  onChange={(e) => setNewStateName(e.target.value)}
                  placeholder="São Paulo"
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAddState}
                disabled={!newStateUf || !newStateName || isSubmitting}
              >
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* LISTA DE ESTADOS */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {/* Cabeçalho da tabela */}
        <div className="grid grid-cols-12 gap-4 border-b border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-600">
          <div className="col-span-2">UF</div>
          <div className="col-span-4">Nome</div>
          <div className="col-span-2 text-center">Cidades</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>

        {/* Corpo da lista */}
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <p>Carregando...</p>
            </div>
          ) : filteredStates.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MapPin className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p>Nenhum estado encontrado</p>
              <p className="text-sm">
                Tente ajustar sua busca ou adicione um novo estado
              </p>
            </div>
          ) : (
            states.map((state) => (
              <div
                key={state.uf}
                className="grid grid-cols-12 items-center gap-4 p-4 transition-colors hover:bg-gray-50"
              >
                {/* UF */}
                <div className="col-span-2">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700">
                    {state.uf}
                  </span>
                </div>

                {/* Nome */}
                <div className="col-span-4">
                  <p className="font-medium text-gray-900">{state.name}</p>
                  <p className="text-xs text-gray-500">
                    Adicionado em {state.createdAt.toLocaleDateString("pt-BR")}
                  </p>
                </div>

                {/* Cidades */}
                <div className="col-span-2 text-center">
                  <span
                    className={`text-sm ${state.citiesCount > 0 ? "font-medium text-gray-900" : "text-gray-400"}`}
                  >
                    {state.citiesCount}{" "}
                    {state.citiesCount === 1 ? "cidade" : "cidades"}
                  </span>
                </div>

                {/* Status (Toggle) */}
                <div className="col-span-2 text-center">
                  <button
                    onClick={() => handleToggleState(state.uf, state.isActive)}
                    className="inline-flex items-center justify-center focus:outline-none"
                    title={
                      state.isActive
                        ? "Desativar atendimento"
                        : "Ativar atendimento"
                    }
                  >
                    {state.isActive ? (
                      <ToggleRight className="h-8 w-8 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-gray-300" />
                    )}
                  </button>
                  <p className="mt-1 text-xs text-gray-500">
                    {state.isActive ? "Ativo" : "Inativo"}
                  </p>
                </div>

                {/* Ações */}
                <div className="col-span-2 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                    asChild
                  >
                    <a
                      href={`/admin/logistics/regions/cities?state=${state.uf}`}
                    >
                      Cidades
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="mt-4 text-right text-sm text-gray-500">
        {filteredStates.length}{" "}
        {filteredStates.length === 1
          ? "estado encontrado"
          : "estados encontrados"}
      </div>
    </div>
  );
}
