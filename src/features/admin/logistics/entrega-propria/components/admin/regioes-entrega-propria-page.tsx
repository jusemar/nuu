"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  alternarStatusRegiaoEntregaPropria,
  atualizarRegiaoEntregaPropria,
  criarRegiaoEntregaPropria,
} from "../../actions/admin-entrega-propria.actions";
import type { EntregaPropriaRegiaoResumo } from "../../queries/admin-entrega-propria.queries";
import { montarUrlCidadeEntregaPropria } from "./entrega-propria-formatters";

type RegioesEntregaPropriaPageProps = {
  stateUf: string;
  city: string;
  regioes: EntregaPropriaRegiaoResumo[];
};

type RegiaoForm = {
  id?: number;
  name: string;
  description: string;
};

const emptyForm: RegiaoForm = {
  name: "",
  description: "",
};

export function RegioesEntregaPropriaPage({
  stateUf,
  city,
  regioes,
}: RegioesEntregaPropriaPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<RegiaoForm>(emptyForm);
  const [isPending, startTransition] = useTransition();

  const regioesFiltradas = useMemo(() => {
    const termo = searchTerm.trim().toLowerCase();
    if (!termo) return regioes;

    return regioes.filter(
      (regiao) =>
        regiao.name.toLowerCase().includes(termo) ||
        regiao.description?.toLowerCase().includes(termo),
    );
  }, [regioes, searchTerm]);

  function openCreateModal() {
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  function openEditModal(regiao: EntregaPropriaRegiaoResumo) {
    setForm({
      id: regiao.id,
      name: regiao.name,
      description: regiao.description ?? "",
    });
    setIsModalOpen(true);
  }

  function handleSave() {
    startTransition(async () => {
      if (form.id) {
        await atualizarRegiaoEntregaPropria(form.id, {
          name: form.name,
          description: form.description,
        });
      } else {
        await criarRegiaoEntregaPropria({
          name: form.name,
          description: form.description,
          state: stateUf,
          city,
        });
      }

      setIsModalOpen(false);
      setForm(emptyForm);
    });
  }

  function handleToggle(id: number) {
    startTransition(async () => {
      await alternarStatusRegiaoEntregaPropria(id);
    });
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
          <Link
            href={montarUrlCidadeEntregaPropria(stateUf)}
            className="flex items-center gap-1 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Cidades
          </Link>
          <span>/</span>
          <span className="font-medium text-gray-900">
            {city} - {stateUf}
          </span>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Regioes da Entrega Propria
        </h1>
        <p className="text-gray-600">
          Crie regioes para agrupar bairros atendidos pela Entrega Propria.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar regiao"
            className="pl-10"
          />
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Regiao
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Regiao</TableHead>
              <TableHead className="text-center">Bairros</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {regioesFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-36 text-center">
                  <MapPin className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="font-medium text-gray-700">
                    Nenhuma regiao cadastrada
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              regioesFiltradas.map((regiao) => (
                <TableRow key={regiao.id}>
                  <TableCell>
                    <Link
                      href={`/admin/logistics/entrega-propria/regioes/${regiao.id}`}
                      className="font-medium text-gray-900 hover:text-blue-700"
                    >
                      {regiao.name}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {regiao.description || `${regiao.city} - ${regiao.state}`}
                    </p>
                  </TableCell>
                  <TableCell className="text-center">
                    {regiao.bairrosCount}{" "}
                    {regiao.bairrosCount === 1 ? "bairro" : "bairros"}
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      type="button"
                      onClick={() => handleToggle(regiao.id)}
                      disabled={isPending}
                      className="inline-flex items-center justify-center"
                      title={regiao.isActive ? "Desativar" : "Ativar"}
                    >
                      {regiao.isActive ? (
                        <ToggleRight className="h-8 w-8 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-gray-300" />
                      )}
                    </button>
                    <Badge
                      variant={regiao.isActive ? "default" : "secondary"}
                      className="ml-2"
                    >
                      {regiao.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(regiao)}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                        asChild
                      >
                        <Link
                          href={`/admin/logistics/entrega-propria/regioes/${regiao.id}`}
                        >
                          Bairros
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Editar Regiao" : "Nova Regiao"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="region-name">Nome da regiao</Label>
              <Input
                id="region-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Ex: Zona Norte"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region-description">Descricao</Label>
              <Input
                id="region-description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending || !form.name.trim()}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
