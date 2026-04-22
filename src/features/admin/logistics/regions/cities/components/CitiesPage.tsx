/**
 * PÁGINA DE CIDADES - Regiões de Atendimento
 *
 * Lista cidades do estado selecionado com:
 * - Busca por nome
 * - Toggle ativar/desativar
 * - Indicador de bairros específicos
 * - Métodos de entrega disponíveis
 * - LINK para gerenciar bairros/rotas
 */

"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Building2,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  MapPin,
  ArrowLeft,
  Navigation,
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
  getCities,
  createCity,
  updateCityStatus,
} from "../services/citiesService";
import type { City } from "../types/cities";

interface CitiesPageProps {
  stateUf?: string;
  stateName?: string;
}

export function CitiesPage({ stateUf, stateName }: CitiesPageProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCities();
  }, [stateUf]);

  async function loadCities() {
    setIsLoading(true);
    try {
      const data = await getCities(stateUf);
      setCities(data);
    } catch (error) {
      console.error("Erro ao carregar cidades:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddCity() {
    if (!newCityName || !stateUf) return;

    setIsSubmitting(true);
    try {
      await createCity({
        name: newCityName,
        stateUf: stateUf,
        isActive: true,
        neighborhoodsCount: 0,
        availableMethods: [],
      });
      setIsModalOpen(false);
      setNewCityName("");
      loadCities();
    } catch (error) {
      console.error("Erro ao criar cidade:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleCity(id: string, currentStatus: boolean) {
    try {
      await updateCityStatus(id, !currentStatus);
      loadCities();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  }

  const filteredCities = searchTerm
    ? cities.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : cities;

  const methodLabels: Record<string, string> = {
    motoboy: "Motoboy",
    transportadora: "Transportadora",
    fornecedor: "Fornecedor",
    retirada: "Retirada",
  };

  const formatarPreco = (valor?: number) => {
    if (valor === undefined || valor === null) return "-";
    if (valor === 0) return "Grátis";
    return `R$ ${valor.toFixed(2).replace(".", ",")}`;
  };

  const formatarPrazo = (min: number, max: number) => {
    if (min === 0 && max === 0) return "Hoje";
    if (min === max) return `${min} dias`;
    return `${min} a ${max} dias`;
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* CABEÇALHO */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
          <a
            href="/admin/logistics/regions/states"
            className="flex items-center gap-1 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Estados
          </a>
          <span>/</span>
          <span className="font-medium text-gray-900">
            {stateName || stateUf || "Todas"}
          </span>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Cidades Atendidas
        </h1>
        <p className="text-gray-600">
          Gerencie quais cidades possuem entrega.
          {stateUf
            ? ` Estado: ${stateName || stateUf}.`
            : " Mostrando todas as cidades."}
        </p>
      </div>

      {/* AÇÕES: Busca + Botão Adicionar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Cidade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Cidade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="cityName">Nome da Cidade</Label>
                <Input
                  id="cityName"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  placeholder="São Paulo"
                  className="mt-1"
                />
              </div>
              {stateUf && (
                <p className="text-sm text-gray-500">
                  Estado: {stateName || stateUf}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAddCity}
                disabled={!newCityName || !stateUf || isSubmitting}
              >
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* LISTA DE CIDADES */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {/* Cabeçalho */}
        <div className="grid grid-cols-12 gap-4 border-b border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-600">
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
              <Building2 className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p>Nenhuma cidade encontrada</p>
              <p className="text-sm">Adicione uma cidade ou ajuste sua busca</p>
            </div>
          ) : (
            cities.map((city) => (
              <div
                key={city.id}
                className="grid grid-cols-12 items-center gap-4 p-4 transition-colors hover:bg-gray-50"
              >
                {/* Cidade */}
                <div className="col-span-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{city.name}</p>
                      <p className="text-xs text-gray-500">
                        {city.stateUf} •{" "}
                        {city.createdAt.toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bairros - ALTERADO: mostra contagem e link */}
                <div className="col-span-2 text-center">
                  {city.bairrosCount > 0 ? (
                    <a
                      href={`/admin/logistics/bairros?cidade=${encodeURIComponent(city.name)}&uf=${city.stateUf}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm text-indigo-600 transition-colors hover:bg-indigo-100 hover:text-indigo-800"
                    >
                      <MapPin className="h-3 w-3" />
                      {city.bairrosCount}{" "}
                      {city.bairrosCount === 1 ? "bairro" : "bairros"}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </div>

                {/* Métodos */}
                <div className="col-span-4">
                  {city.availableMethods.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {city.availableMethods.map((method) => (
                        <span
                          key={method}
                          className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700"
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
                    onClick={() => handleToggleCity(city.id, city.isActive)}
                    className="focus:outline-none"
                    title={city.isActive ? "Desativar" : "Ativar"}
                  >
                    {city.isActive ? (
                      <ToggleRight className="h-8 w-8 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-gray-300" />
                    )}
                  </button>
                </div>

                {/* Ações - ALTERADO: adiciona botão Bairros */}
                <div className="col-span-2 flex items-center justify-end gap-1 text-right">
                  {/* NOVO: Botão Bairros */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800"
                    asChild
                  >
                    <a
                      href={`/admin/logistics/bairros?cidade=${encodeURIComponent(city.name)}&uf=${city.stateUf}`}
                    >
                      <Navigation className="mr-1 h-4 w-4" />
                      Bairros
                    </a>
                  </Button>

                  {city.neighborhoodsCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                    >
                      Detalhes
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Contador */}
      <div className="mt-4 text-right text-sm text-gray-500">
        {filteredCities.length}{" "}
        {filteredCities.length === 1 ? "cidade" : "cidades"}
      </div>
    </div>
  );
}
