"use client";

import Link from "next/link";
import { Fragment, useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Home,
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
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
  adicionarBairroDaBaseNaRegiaoEntregaPropria,
  adicionarFaixaCepRegiaoEntregaPropria,
  adicionarBairroPorCepNaRegiaoEntregaPropria,
  cadastrarBairroPendenteComoAvulsoEntregaPropria,
  gerarFaixasCepRegiaoEntregaPropria,
  ignorarBairroPendenteEntregaPropria,
  removerFaixaCepRegiaoEntregaPropria,
  removerBairroDaRegiaoEntregaPropria,
  vincularBairroPendenteNaRegiaoEntregaPropria,
} from "../../actions/admin-entrega-propria.actions";
import type { EntregaPropriaRegiaoDetalhe } from "../../queries/admin-entrega-propria.queries";
import { montarUrlRegioesEntregaPropria } from "./entrega-propria-formatters";

type RegiaoBairrosEntregaPropriaPageProps = {
  regiao: EntregaPropriaRegiaoDetalhe;
};

export function RegiaoBairrosEntregaPropriaPage({
  regiao,
}: RegiaoBairrosEntregaPropriaPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBairroBase, setSearchBairroBase] = useState("");
  const [cepReferencia, setCepReferencia] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFaixaModalOpen, setIsFaixaModalOpen] = useState(false);
  const [bairroAbertoId, setBairroAbertoId] = useState<number | null>(null);
  const [cepStart, setCepStart] = useState("");
  const [cepEnd, setCepEnd] = useState("");
  const [isPending, startTransition] = useTransition();

  const totalCepsVinculados = useMemo(() => {
    return regiao.bairros.reduce(
      (total, bairro) => total + bairro.cepsCount,
      0,
    );
  }, [regiao.bairros]);

  const bairrosFiltrados = useMemo(() => {
    const termo = searchTerm.trim().toLowerCase();
    if (!termo) return regiao.bairros;

    return regiao.bairros.filter((bairro) =>
      bairro.neighborhood.toLowerCase().includes(termo),
    );
  }, [regiao.bairros, searchTerm]);

  const bairrosPendentesDisponiveis = useMemo(() => {
    return regiao.bairrosPendentes;
  }, [regiao.bairrosPendentes]);

  const bairrosBaseDisponiveis = useMemo(() => {
    const termo = searchBairroBase.trim().toLowerCase();
    return regiao.bairrosBaseLocal
      .filter((bairro) => !bairro.vinculado)
      .filter((bairro) =>
        termo ? bairro.neighborhood.toLowerCase().includes(termo) : true,
      )
      .slice(0, 60);
  }, [regiao.bairrosBaseLocal, searchBairroBase]);

  function formatCep(cep: string) {
    return `${cep.slice(0, 5)}-${cep.slice(5)}`;
  }

  function handleAddBairroBase(neighborhood: string) {
    startTransition(async () => {
      await adicionarBairroDaBaseNaRegiaoEntregaPropria(
        regiao.id,
        neighborhood,
      );
    });
  }

  function handleAddBairro() {
    startTransition(async () => {
      await adicionarBairroPorCepNaRegiaoEntregaPropria(
        regiao.id,
        cepReferencia,
      );
      setCepReferencia("");
      setIsModalOpen(false);
    });
  }

  function handleVincularPendente(bairroId: number) {
    startTransition(async () => {
      await vincularBairroPendenteNaRegiaoEntregaPropria(regiao.id, bairroId);
    });
  }

  function handleRemoveBairro(bairroId: number) {
    startTransition(async () => {
      await removerBairroDaRegiaoEntregaPropria(regiao.id, bairroId);
    });
  }

  function handleGerarFaixas() {
    startTransition(async () => {
      await gerarFaixasCepRegiaoEntregaPropria(regiao.id);
    });
  }

  function handleAddFaixa() {
    startTransition(async () => {
      await adicionarFaixaCepRegiaoEntregaPropria({
        regiaoId: regiao.id,
        cepStart,
        cepEnd,
      });
      setCepStart("");
      setCepEnd("");
      setIsFaixaModalOpen(false);
    });
  }

  function handleRemoveFaixa(rangeId: number) {
    startTransition(async () => {
      await removerFaixaCepRegiaoEntregaPropria(regiao.id, rangeId);
    });
  }

  function handleCadastrarAvulso(bairroId: number) {
    startTransition(async () => {
      await cadastrarBairroPendenteComoAvulsoEntregaPropria(bairroId);
    });
  }

  function handleIgnorarPendente(bairroId: number) {
    startTransition(async () => {
      await ignorarBairroPendenteEntregaPropria(bairroId);
    });
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
          <Link
            href={montarUrlRegioesEntregaPropria(regiao.state, regiao.city)}
            className="flex items-center gap-1 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Regioes
          </Link>
          <span>/</span>
          <span className="font-medium text-gray-900">{regiao.name}</span>
        </div>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Bairros da regiao
            </h1>
            <p className="text-gray-600">
              {regiao.name} em {regiao.city} - {regiao.state}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={regiao.isActive ? "default" : "secondary"}>
              {regiao.isActive ? "Regiao ativa" : "Regiao inativa"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar bairro vinculado"
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar bairros
        </Button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Bairros vinculados</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {regiao.bairros.length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">CEPs conhecidos</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {totalCepsVinculados}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Faixas da regiao</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {regiao.cepRanges.length}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Bairro</TableHead>
                <TableHead className="w-36 text-right">CEPs</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bairrosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-36 text-center">
                    <Home className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                    <p className="font-medium text-gray-700">
                      Nenhum bairro vinculado
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                bairrosFiltrados.map((bairro) => (
                  <Fragment key={bairro.id}>
                    <TableRow>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                            onClick={() =>
                              setBairroAbertoId((current) =>
                                current === bairro.id ? null : bairro.id,
                              )
                            }
                            aria-label={`Ver CEPs de ${bairro.neighborhood}`}
                          >
                            {bairroAbertoId === bairro.id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                          <div>
                            <p className="font-medium text-gray-900">
                              {bairro.neighborhood}
                            </p>
                            <p className="text-xs text-gray-500">
                              {bairro.cepRanges.length}{" "}
                              {bairro.cepRanges.length === 1
                                ? "faixa organizada"
                                : "faixas organizadas"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 font-semibold text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                          onClick={() =>
                            setBairroAbertoId((current) =>
                              current === bairro.id ? null : bairro.id,
                            )
                          }
                        >
                          {bairro.cepsCount} CEPs
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          disabled={isPending}
                          onClick={() => handleRemoveBairro(bairro.id)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Remover
                        </Button>
                      </TableCell>
                    </TableRow>
                    {bairroAbertoId === bairro.id ? (
                      <TableRow key={`${bairro.id}-ceps`}>
                        <TableCell colSpan={3} className="bg-gray-50 p-0">
                          <div className="grid gap-4 p-4 xl:grid-cols-[280px_minmax(0,1fr)]">
                            <div className="rounded-md border border-gray-200 bg-white p-3">
                              <div className="mb-3 flex items-center justify-between gap-2">
                                <h3 className="text-sm font-semibold text-gray-900">
                                  Faixas do bairro
                                </h3>
                                <Badge variant="secondary">
                                  {bairro.cepRanges.length}
                                </Badge>
                              </div>
                              <div className="max-h-64 space-y-2 overflow-auto">
                                {bairro.cepRanges.length === 0 ? (
                                  <p className="text-sm text-gray-500">
                                    Nenhuma faixa encontrada na base local.
                                  </p>
                                ) : (
                                  bairro.cepRanges.map((range) => (
                                    <div
                                      key={`${range.cepStart}-${range.cepEnd}`}
                                      className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700"
                                    >
                                      {formatCep(range.cepStart)} ate{" "}
                                      {formatCep(range.cepEnd)}
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            <div className="rounded-md border border-gray-200 bg-white">
                              <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                                <h3 className="text-sm font-semibold text-gray-900">
                                  CEPs relacionados
                                </h3>
                                <span className="text-xs text-gray-500">
                                  {bairro.cepsCount} registros
                                </span>
                              </div>
                              <div className="max-h-72 overflow-auto">
                                {bairro.ceps.length === 0 ? (
                                  <p className="p-3 text-sm text-gray-500">
                                    Nenhum CEP local encontrado para este
                                    bairro.
                                  </p>
                                ) : (
                                  <div className="divide-y divide-gray-100">
                                    {bairro.ceps.map((address) => (
                                      <div
                                        key={address.cep}
                                        className="grid gap-1 px-3 py-2 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center"
                                      >
                                        <span className="font-mono text-sm font-semibold text-gray-900">
                                          {formatCep(address.cep)}
                                        </span>
                                        <span className="truncate text-sm text-gray-600">
                                          {address.street ||
                                            "Logradouro nao informado"}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <aside className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-6">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Faixas de CEP
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Cobertura gerada a partir dos bairros vinculados.
                </p>
              </div>
              <MapPin className="h-5 w-5 text-blue-500" />
            </div>
            <div className="mb-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={handleGerarFaixas}
              >
                Gerar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFaixaModalOpen(true)}
              >
                Manual
              </Button>
            </div>
            <div className="max-h-56 space-y-2 overflow-auto">
              {regiao.cepRanges.length === 0 ? (
                <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-500">
                  Nenhuma faixa gerada para esta regiao.
                </p>
              ) : (
                regiao.cepRanges.map((range) => (
                  <div
                    key={range.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-gray-100 p-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCep(range.cepStart)} até{" "}
                        {formatCep(range.cepEnd)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {range.source === "auto" ? "Automatica" : "Manual"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      disabled={isPending}
                      onClick={() => handleRemoveFaixa(range.id)}
                    >
                      Remover
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Bairros pendentes
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Consultas de clientes sem regra cadastrada nesta cidade.
              </p>
            </div>
            <MapPin className="h-5 w-5 text-amber-500" />
          </div>

          <div className="space-y-2">
            {bairrosPendentesDisponiveis.length === 0 ? (
              <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-500">
                Nenhum bairro pendente disponivel para esta cidade.
              </p>
            ) : (
              bairrosPendentesDisponiveis.map((bairro) => (
                <div
                  key={bairro.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-gray-100 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {bairro.neighborhood}
                    </p>
                    <p className="text-xs text-gray-500">
                      {bairro.city}/{bairro.state} - CEP {bairro.lastCep}
                    </p>
                    <p className="text-xs text-amber-700">
                      Consultado {bairro.consultationCount}{" "}
                      {bairro.consultationCount === 1 ? "vez" : "vezes"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleVincularPendente(bairro.id)}
                    >
                      Adicionar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleCadastrarAvulso(bairro.id)}
                    >
                      Avulso
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-red-700"
                      disabled={isPending}
                      onClick={() => handleIgnorarPendente(bairro.id)}
                    >
                      Ignorar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar bairros da base local</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bairro-base">Buscar bairro</Label>
              <Input
                id="bairro-base"
                value={searchBairroBase}
                onChange={(event) => setSearchBairroBase(event.target.value)}
                placeholder="Digite parte do nome do bairro"
              />
            </div>
            <div className="max-h-72 space-y-2 overflow-auto rounded-md border border-gray-100 p-2">
              {bairrosBaseDisponiveis.length === 0 ? (
                <p className="p-3 text-sm text-gray-500">
                  Nenhum bairro disponivel na base local para esta busca.
                </p>
              ) : (
                bairrosBaseDisponiveis.map((bairro) => (
                  <button
                    key={bairro.neighborhood}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleAddBairroBase(bairro.neighborhood)}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-60"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {bairro.neighborhood}
                    </span>
                    <span className="text-xs text-gray-500">
                      {bairro.cepsCount} CEPs
                    </span>
                  </button>
                ))
              )}
            </div>
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="bairro-cep">CEP de referencia</Label>
              <Input
                id="bairro-cep"
                value={cepReferencia}
                onChange={(event) => setCepReferencia(event.target.value)}
                placeholder="00000-000"
                inputMode="numeric"
              />
              <p className="text-sm text-gray-500">
                Use apenas se o bairro ainda nao aparecer na base local.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddBairro}
              disabled={
                isPending || cepReferencia.replace(/\D/g, "").length !== 8
              }
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFaixaModalOpen} onOpenChange={setIsFaixaModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar faixa de CEP</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cep-start">CEP inicial</Label>
              <Input
                id="cep-start"
                value={cepStart}
                onChange={(event) => setCepStart(event.target.value)}
                placeholder="00000-000"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cep-end">CEP final</Label>
              <Input
                id="cep-end"
                value={cepEnd}
                onChange={(event) => setCepEnd(event.target.value)}
                placeholder="00000-000"
                inputMode="numeric"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFaixaModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddFaixa}
              disabled={
                isPending ||
                cepStart.replace(/\D/g, "").length !== 8 ||
                cepEnd.replace(/\D/g, "").length !== 8
              }
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
