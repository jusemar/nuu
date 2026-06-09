"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Filter,
  ReceiptText,
  Search,
  ShieldCheck,
  TicketPercent,
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

import type { ResultadoAuditoriaCuponsAdmin } from "../../types";

type FiltrosAuditoriaCuponsAdmin = {
  busca: string;
  codigoCupom: string;
  numeroPedido: string;
  cliente: string;
  statusPagamento: string;
  pagina: number;
};

type FiltrosExportacaoAuditoriaCuponsAdmin = {
  periodoInicio: string;
  periodoFim: string;
  gateway: string;
  inconsistencia: string;
};

type PaginaAuditoriaCuponsAdminProps = {
  resultado: ResultadoAuditoriaCuponsAdmin;
  filtros: FiltrosAuditoriaCuponsAdmin;
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

function obterClasseSeveridade(severidade: "baixa" | "media" | "alta") {
  if (severidade === "alta") return "border-rose-200 bg-rose-50 text-rose-900";
  if (severidade === "media")
    return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-50 text-slate-800";
}

export function PaginaAuditoriaCuponsAdmin({
  resultado,
  filtros,
}: PaginaAuditoriaCuponsAdminProps) {
  const router = useRouter();
  const [filtrosLocais, setFiltrosLocais] = useState(filtros);
  const [filtrosExportacao, setFiltrosExportacao] =
    useState<FiltrosExportacaoAuditoriaCuponsAdmin>({
      periodoInicio: "",
      periodoFim: "",
      gateway: "todos",
      inconsistencia: "todas",
    });

  function atualizarFiltro(
    campo: keyof FiltrosAuditoriaCuponsAdmin,
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
    if (filtrosLocais.codigoCupom) {
      params.set("codigoCupom", filtrosLocais.codigoCupom);
    }
    if (filtrosLocais.numeroPedido) {
      params.set("numeroPedido", filtrosLocais.numeroPedido);
    }
    if (filtrosLocais.cliente) params.set("cliente", filtrosLocais.cliente);
    if (
      filtrosLocais.statusPagamento &&
      filtrosLocais.statusPagamento !== "todos"
    ) {
      params.set("statusPagamento", filtrosLocais.statusPagamento);
    }
    params.set("pagina", String(pagina));
    router.push(`/admin/marketing/auditoria-cupons?${params.toString()}`);
  }

  function atualizarFiltroExportacao(
    campo: keyof FiltrosExportacaoAuditoriaCuponsAdmin,
    valor: string,
  ) {
    setFiltrosExportacao((atual) => ({ ...atual, [campo]: valor }));
  }

  function exportarCsv() {
    const params = new URLSearchParams();
    if (filtrosExportacao.periodoInicio) {
      params.set("periodoInicio", filtrosExportacao.periodoInicio);
    }
    if (filtrosExportacao.periodoFim) {
      params.set("periodoFim", filtrosExportacao.periodoFim);
    }
    if (filtrosLocais.codigoCupom) {
      params.set("codigoCupom", filtrosLocais.codigoCupom);
    }
    if (
      filtrosLocais.statusPagamento &&
      filtrosLocais.statusPagamento !== "todos"
    ) {
      params.set("statusPagamento", filtrosLocais.statusPagamento);
    }
    if (filtrosExportacao.gateway !== "todos") {
      params.set("gateway", filtrosExportacao.gateway);
    }
    if (filtrosExportacao.inconsistencia !== "todas") {
      params.set("inconsistencia", filtrosExportacao.inconsistencia);
    }

    window.location.href = `/admin/marketing/auditoria-cupons/exportar?${params.toString()}`;
  }

  const possuiInconsistencias = resultado.inconsistencias.length > 0;

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-cyan-950 to-emerald-950 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge className="w-fit bg-white/10 text-white hover:bg-white/10">
              Marketing
            </Badge>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">
                Auditoria de cupons
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
                Reconciliação de usos, pedidos, pagamentos e webhooks usando
                snapshots oficiais. Nenhum valor financeiro é recalculado aqui.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
            <p className="text-xs tracking-[0.24em] text-slate-300 uppercase">
              Saúde operacional
            </p>
            <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
              {possuiInconsistencias ? (
                <AlertTriangle className="size-5 text-amber-300" />
              ) : (
                <ShieldCheck className="size-5 text-emerald-300" />
              )}
              {possuiInconsistencias
                ? `${resultado.inconsistencias.length} alerta(s)`
                : "Sem alertas"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TicketPercent className="size-4 text-emerald-700" />
              Usos registrados
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {resultado.resumo.totalUsosRegistrados}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ReceiptText className="size-4 text-cyan-700" />
              Desconto auditado
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatarPreco(resultado.resumo.totalDescontoRegistradoEmCentavos)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="size-4 text-amber-700" />
              Inconsistências
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {resultado.inconsistencias.length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 text-blue-700" />
              Páginas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {resultado.pagina}/{resultado.totalPaginas}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="size-5" />
            Filtros de auditoria
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="space-y-2 xl:col-span-2">
            <Label>Busca geral</Label>
            <Input
              value={filtrosLocais.busca}
              placeholder="Cupom, pedido ou cliente"
              onChange={(evento) =>
                atualizarFiltro("busca", evento.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Cupom</Label>
            <Input
              value={filtrosLocais.codigoCupom}
              placeholder="PROMO10"
              onChange={(evento) =>
                atualizarFiltro("codigoCupom", evento.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Pedido</Label>
            <Input
              value={filtrosLocais.numeroPedido}
              placeholder="#123"
              onChange={(evento) =>
                atualizarFiltro("numeroPedido", evento.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Input
              value={filtrosLocais.cliente}
              placeholder="Nome ou email"
              onChange={(evento) =>
                atualizarFiltro("cliente", evento.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filtrosLocais.statusPagamento}
              onValueChange={(valor) =>
                atualizarFiltro("statusPagamento", valor)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full gap-2" onClick={() => aplicarFiltros(1)}>
              <Search className="size-4" />
              Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="size-5" />
              Exportação CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-2">
              <Label>Início</Label>
              <Input
                type="date"
                value={filtrosExportacao.periodoInicio}
                onChange={(evento) =>
                  atualizarFiltroExportacao(
                    "periodoInicio",
                    evento.target.value,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Fim</Label>
              <Input
                type="date"
                value={filtrosExportacao.periodoFim}
                onChange={(evento) =>
                  atualizarFiltroExportacao("periodoFim", evento.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Gateway</Label>
              <Select
                value={filtrosExportacao.gateway}
                onValueChange={(valor) =>
                  atualizarFiltroExportacao("gateway", valor)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="efibank">Efí Pix</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Inconsistência</Label>
              <Select
                value={filtrosExportacao.inconsistencia}
                onValueChange={(valor) =>
                  atualizarFiltroExportacao("inconsistencia", valor)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="pedido_pago_sem_uso">
                    Pedido pago sem uso
                  </SelectItem>
                  <SelectItem value="uso_sem_pagamento_aprovado">
                    Uso sem pagamento
                  </SelectItem>
                  <SelectItem value="uso_duplicado">Duplicidade</SelectItem>
                  <SelectItem value="webhook_com_falha">
                    Webhook falhou
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full gap-2" onClick={exportarCsv}>
                <Download className="size-4" />
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cupons mais usados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resultado.resumo.cuponsMaisUsados.map((cupom) => (
              <div
                key={cupom.codigoCupom}
                className="flex items-center justify-between rounded-xl border p-3"
              >
                <div>
                  <p className="font-semibold">{cupom.codigoCupom}</p>
                  <p className="text-muted-foreground text-xs">
                    {cupom.totalUsos} uso(s)
                  </p>
                </div>
                <span className="text-sm font-semibold">
                  {formatarPreco(cupom.totalDescontoEmCentavos)}
                </span>
              </div>
            ))}
            {resultado.resumo.cuponsMaisUsados.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum cupom usado ainda.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usos de cupons</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cupom</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Data uso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultado.usos.map((uso) => {
                const badge = obterBadgePagamento(uso.statusPagamento);

                return (
                  <TableRow key={uso.id}>
                    <TableCell className="font-semibold">
                      {uso.codigoCupom}
                    </TableCell>
                    <TableCell>{uso.numeroPedido ?? "Sem pedido"}</TableCell>
                    <TableCell>
                      <div className="min-w-44">
                        <p className="font-medium">
                          {uso.clienteNome ?? "Cliente não encontrado"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {uso.clienteEmail ?? "Sem email"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatarPreco(uso.descontoAplicadoEmCentavos)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge className={badge.classe}>{badge.rotulo}</Badge>
                        <p className="text-muted-foreground text-xs">
                          {uso.gateway ?? "Sem gateway"} ·{" "}
                          {uso.metodoPagamento ?? "sem método"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {uso.origemGatewayWebhook}
                    </TableCell>
                    <TableCell>{formatarData(uso.dataUso)}</TableCell>
                  </TableRow>
                );
              })}
              {resultado.usos.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground py-10 text-center"
                  >
                    Nenhum uso de cupom encontrado.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          {resultado.total} registro(s) encontrados
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-700" />
            Alertas operacionais
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          {resultado.inconsistencias.map((inconsistencia) => (
            <div
              key={inconsistencia.id}
              className={`rounded-2xl border p-4 ${obterClasseSeveridade(
                inconsistencia.severidade,
              )}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{inconsistencia.titulo}</p>
                  <p className="mt-1 text-sm opacity-80">
                    {inconsistencia.descricao}
                  </p>
                </div>
                <Badge variant="outline">{inconsistencia.severidade}</Badge>
              </div>
              <div className="mt-3 grid gap-1 text-xs opacity-80">
                <span>Pedido: {inconsistencia.numeroPedido ?? "N/A"}</span>
                <span>Cupom: {inconsistencia.codigoCupom ?? "N/A"}</span>
                <span>
                  Data: {formatarData(inconsistencia.criadoEm ?? null)}
                </span>
              </div>
            </div>
          ))}
          {resultado.inconsistencias.length === 0 ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 lg:col-span-2">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="size-5" />
                Nenhuma inconsistência encontrada
              </div>
              <p className="mt-1 text-sm">
                Os registros de uso, pagamentos e webhooks não apresentam
                divergências básicas nesta consulta.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
