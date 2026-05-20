"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  MapPinned,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EntregaPropriaCidadeResumo } from "../../queries/admin-entrega-propria.queries";
import { montarUrlRegioesEntregaPropria } from "./entrega-propria-formatters";

type CidadesEntregaPropriaPageProps = {
  stateUf: string;
  stateName: string;
  cidades: EntregaPropriaCidadeResumo[];
};

export function CidadesEntregaPropriaPage({
  stateUf,
  stateName,
  cidades,
}: CidadesEntregaPropriaPageProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const cidadesFiltradas = useMemo(() => {
    const termo = searchTerm.trim().toLowerCase();
    if (!termo) return cidades;

    return cidades.filter((cidade) =>
      cidade.name.toLowerCase().includes(termo),
    );
  }, [cidades, searchTerm]);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
          <Link
            href="/admin/logistics/entrega-propria"
            className="flex items-center gap-1 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Estados
          </Link>
          <span>/</span>
          <span className="font-medium text-gray-900">
            {stateName || stateUf}
          </span>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Cidades da Entrega Propria
        </h1>
        <p className="text-gray-600">
          Escolha a cidade para visualizar e criar regioes de atendimento.
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar cidade"
            className="pl-10"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Cidade</TableHead>
              <TableHead className="text-center">Regioes</TableHead>
              <TableHead className="text-center">Bairros em regioes</TableHead>
              <TableHead className="text-center">Pendentes</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cidadesFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-36 text-center">
                  <Building2 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="font-medium text-gray-700">
                    Nenhuma cidade encontrada
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              cidadesFiltradas.map((cidade) => (
                <TableRow key={cidade.id}>
                  <TableCell>
                    <Link
                      href={montarUrlRegioesEntregaPropria(
                        cidade.stateUf,
                        cidade.name,
                      )}
                      className="font-medium text-gray-900 hover:text-blue-700"
                    >
                      {cidade.name}
                    </Link>
                    <p className="text-xs text-gray-500">{cidade.stateUf}</p>
                  </TableCell>
                  <TableCell className="text-center">
                    {cidade.regioesCount}
                  </TableCell>
                  <TableCell className="text-center">
                    {cidade.bairrosEmRegioesCount}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={
                        cidade.bairrosPendentesCount > 0
                          ? "font-medium text-amber-700"
                          : "text-gray-400"
                      }
                    >
                      {cidade.bairrosPendentesCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={cidade.isActive ? "default" : "secondary"}>
                      {cidade.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                      asChild
                    >
                      <Link
                        href={montarUrlRegioesEntregaPropria(
                          cidade.stateUf,
                          cidade.name,
                        )}
                      >
                        <MapPinned className="mr-1 h-4 w-4" />
                        Regioes
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 text-right text-sm text-gray-500">
        {cidadesFiltradas.length}{" "}
        {cidadesFiltradas.length === 1 ? "cidade" : "cidades"}
      </div>
    </div>
  );
}
