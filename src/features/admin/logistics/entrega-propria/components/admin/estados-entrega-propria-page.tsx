"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Building2, ChevronRight, MapPin, Search } from "lucide-react";
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
import type { EntregaPropriaEstadoResumo } from "../../queries/admin-entrega-propria.queries";
import { montarUrlCidadeEntregaPropria } from "./entrega-propria-formatters";

type EstadosEntregaPropriaPageProps = {
  estados: EntregaPropriaEstadoResumo[];
};

export function EstadosEntregaPropriaPage({
  estados,
}: EstadosEntregaPropriaPageProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const estadosFiltrados = useMemo(() => {
    const termo = searchTerm.trim().toLowerCase();
    if (!termo) return estados;

    return estados.filter(
      (estado) =>
        estado.name.toLowerCase().includes(termo) ||
        estado.uf.toLowerCase().includes(termo),
    );
  }, [estados, searchTerm]);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Entrega Propria
        </h1>
        <p className="text-gray-600">
          Selecione um estado para organizar cidades, regioes e bairros de
          atendimento.
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por estado ou UF"
            className="pl-10"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-24">UF</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-center">Cidades</TableHead>
              <TableHead className="text-center">Regioes</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estadosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-36 text-center">
                  <MapPin className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="font-medium text-gray-700">
                    Nenhum estado encontrado
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              estadosFiltrados.map((estado) => (
                <TableRow key={estado.uf}>
                  <TableCell>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700">
                      {estado.uf}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={montarUrlCidadeEntregaPropria(estado.uf)}
                      className="font-medium text-gray-900 hover:text-blue-700"
                    >
                      {estado.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      {estado.cidadesCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {estado.regioesCount}{" "}
                    {estado.regioesCount === 1 ? "regiao" : "regioes"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={estado.isActive ? "default" : "secondary"}>
                      {estado.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                      asChild
                    >
                      <Link href={montarUrlCidadeEntregaPropria(estado.uf)}>
                        Cidades
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
        {estadosFiltrados.length}{" "}
        {estadosFiltrados.length === 1 ? "estado" : "estados"}
      </div>
    </div>
  );
}
