"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Filter,
  PackageCheck,
  Search,
  Truck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { ResultadoAuditoriaFreteGratisAdmin } from "../../types";

type FiltrosAuditoriaFreteGratisAdmin = {
  busca: string;
  numeroPedido: string;
  cliente: string;
  statusPagamento: string;
  regraFreteGratisId: string;
  periodoInicio: string;
  periodoFim: string;
  pagina: number;
};

type PaginaAuditoriaFreteGratisAdminProps = {
  resultado: ResultadoAuditoriaFreteGratisAdmin;
  filtros: FiltrosAuditoriaFreteGratisAdmin;
};

function formatarPreco(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor / 100);
}

function formatarData(data: Date | string | null) {
  if (!data) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

function obterBadgePagamento(status: string | null) {
  if (status === "paid") {
    return { rotulo: "Pago", classe: "bg-emerald-100 text-emerald-800" };
  }

  if (status === "failed") {
    return { rotulo: "Falhou", classe: "bg-rose-100 text-rose-800" };
  }

  if (status === "expired") {
    return { rotulo: "Expirado", classe: "bg-slate-100 text-slate-700" };
  }

  return { rotulo: "Pendente", classe: "bg-amber-100 text-amber-800" };
}

export function PaginaAuditoriaFreteGratisAdmin({
  resultado,
  filtros,
}: PaginaAuditoriaFreteGratisAdminProps) {
  const router = useRouter();
  const [filtrosLocais, setFiltrosLocais] = useState(filtros);

  function atualizarFiltro(
    campo: keyof FiltrosAuditoriaFreteGratisAdmin,
    valor: string,
  ) {
    setFiltrosLocais((atual) => ({
      ...atual,
      [campo]: campo === "pagina" ? Number(valor) : valor,
    }));
  }

  function aplicarFiltros(pagina = 1) {
    const params = new URLSearchParams();
    if (filtrosLocais.busca) params.set("busca", filtrosLocais.busca);
    if (filtrosLocais.numeroPedido) {
      params.set("numeroPedido", filtrosLocais.numeroPedido);
    }
    if (filtrosLocais.cliente) params.set("cliente", filtrosLocais.cliente);
    if (filtrosLocais.regraFreteGratisId) {
      params.set("regraFreteGratisId", filtrosLocais.regraFreteGratisId);
    }
    if (
      filtrosLocais.statusPagamento &&
      filtrosLocais.statusPagamento !== "todos"
    ) {
      params.set("statusPagamento", filtrosLocais.statusPagamento);
    }
    if (filtrosLocais.periodoInicio) {
      params.set("periodoInicio", filtrosLocais.periodoInicio);
    }
    if (filtrosLocais.periodoFim) {
      params.set("periodoFim", filtrosLocais.periodoFim);
    }
    params.set("pagina", String(pagina));
    router.push(`/admin/marketing/auditoria-frete-gratis?${params.toString()}`);
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-950 via-cyan-950 to-slate-950 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge className="w-fit bg-white/10 text-white hover:bg-white/10">
              Marketing
            </Badge>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">
                Auditoria Frete Grátis
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
                Rastreamento de frete grátis promocional aplicado em pedidos,
                usando somente snapshots financeiros já salvos.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
            <p className="text-xs tracking-[0.24em] text-slate-300 uppercase">
              Modo seguro
            </p>
            <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
              <PackageCheck className="size-5 text-emerald-300" />
              Somente leitura
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Truck className="size-4 text-emerald-700" />
              Pedidos com frete grátis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {resultado.resumo.totalPedidosComFreteGratis}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Desconto total frete</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-700">
              {formatarPreco(resultado.resumo.totalDescontoFreteEmCentavos)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ticket médio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatarPreco(resultado.resumo.ticketMedioEmCentavos)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Regra mais usada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="truncate text-sm font-semibold">
              {resultado.resumo.regraMaisUsada?.regraFreteGratisId ??
                "Sem registros"}
            </p>
            {resultado.resumo.regraMaisUsada ? (
              <p className="text-muted-foreground mt-1 text-xs">
                {resultado.resumo.regraMaisUsada.totalPedidos} pedido(s)
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="size-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Busca</Label>
              <Input
                value={filtrosLocais.busca}
                placeholder="Pedido, cliente ou e-mail"
                onChange={(evento) =>
                  atualizarFiltro("busca", evento.target.value)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pedido</Label>
              <Input
                value={filtrosLocais.numeroPedido}
                placeholder="#123"
                onChange={(evento) =>
                  atualizarFiltro("numeroPedido", evento.target.value)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Input
                value={filtrosLocais.cliente}
                placeholder="Nome ou e-mail"
                onChange={(evento) =>
                  atualizarFiltro("cliente", evento.target.value)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status pagamento</Label>
              <Select
                value={filtrosLocais.statusPagamento}
                onValueChange={(valor) =>
                  atualizarFiltro("statusPagamento", valor)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Regra aplicada</Label>
              <Input
                value={filtrosLocais.regraFreteGratisId}
                placeholder="ID da regra"
                onChange={(evento) =>
                  atualizarFiltro("regraFreteGratisId", evento.target.value)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Período início</Label>
              <Input
                type="date"
                value={filtrosLocais.periodoInicio}
                onChange={(evento) =>
                  atualizarFiltro("periodoInicio", evento.target.value)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Período fim</Label>
              <Input
                type="date"
                value={filtrosLocais.periodoFim}
                onChange={(evento) =>
                  atualizarFiltro("periodoFim", evento.target.value)
                }
              />
            </div>
            <div className="flex items-end">
              <Button
                className="w-full gap-2"
                onClick={() => aplicarFiltros(1)}
              >
                <Search className="size-4" />
                Aplicar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4" />
            Pedidos auditados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Frete original</TableHead>
                  <TableHead>Frete final</TableHead>
                  <TableHead>Desconto frete</TableHead>
                  <TableHead>Regra</TableHead>
                  <TableHead>Modalidade</TableHead>
                  <TableHead>Região</TableHead>
                  <TableHead>Transportadora/serviço</TableHead>
                  <TableHead>Precedência</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultado.pedidos.map((pedido) => {
                  const badge = obterBadgePagamento(pedido.statusPagamento);

                  return (
                    <TableRow key={pedido.pedidoId}>
                      <TableCell className="font-semibold">
                        {pedido.numeroPedido}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-44">
                          <p className="font-medium">
                            {pedido.clienteNome ?? "Cliente sem nome"}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {pedido.clienteEmail ?? "Sem e-mail"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatarPreco(pedido.subtotalEmCentavos)}
                      </TableCell>
                      <TableCell>
                        {formatarPreco(pedido.freteOriginalEmCentavos)}
                      </TableCell>
                      <TableCell className="font-semibold text-emerald-700">
                        {formatarPreco(pedido.freteFinalEmCentavos)}
                      </TableCell>
                      <TableCell className="font-semibold text-emerald-700">
                        -{formatarPreco(pedido.descontoFreteEmCentavos)}
                      </TableCell>
                      <TableCell>
                        <span className="block max-w-44 truncate text-xs">
                          {pedido.regraFreteGratisId ?? "Sem regra"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-44 text-xs">
                          <p className="font-medium">
                            {pedido.modalidadeAplicada ?? "Todas"}
                          </p>
                          <p className="text-muted-foreground truncate">
                            {pedido.modalidadesElegiveis ??
                              "Sem escopo por modalidade"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-44 text-xs">
                          <p className="font-medium">
                            {pedido.regiaoAplicada ?? "Global"}
                          </p>
                          <p className="text-muted-foreground truncate">
                            {pedido.regioesElegiveis ?? "Sem escopo regional"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-52 text-xs">
                          <p className="font-medium">
                            {pedido.servicoAplicado ??
                              pedido.transportadoraAplicada ??
                              "Todos"}
                          </p>
                          <p className="text-muted-foreground truncate">
                            {pedido.servicosElegiveis ??
                              pedido.transportadorasElegiveis ??
                              "Sem escopo por frete"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-44 text-xs">
                          <p className="font-medium capitalize">
                            {pedido.tipoPrioridadeFreteGratis ?? "Legado"}
                          </p>
                          <p className="text-muted-foreground truncate">
                            {pedido.regrasIgnoradasPorPrecedencia
                              ? `Ignoradas: ${pedido.regrasIgnoradasPorPrecedencia}`
                              : "Sem regras ignoradas"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={badge.classe}>{badge.rotulo}</Badge>
                      </TableCell>
                      <TableCell>{formatarData(pedido.dataPedido)}</TableCell>
                    </TableRow>
                  );
                })}
                {resultado.pedidos.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={12}
                      className="text-muted-foreground py-10 text-center text-sm"
                    >
                      Nenhum pedido com frete grátis promocional encontrado.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
              Página {resultado.pagina} de {resultado.totalPaginas} ·{" "}
              {resultado.total} registro(s)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={resultado.pagina <= 1}
                onClick={() => aplicarFiltros(resultado.pagina - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                disabled={resultado.pagina >= resultado.totalPaginas}
                onClick={() => aplicarFiltros(resultado.pagina + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
