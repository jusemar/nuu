"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  Copy,
  Edit3,
  PauseCircle,
  Plus,
  Search,
  TicketPercent,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  alternarStatusCupomPromocaoAdmin,
  duplicarCupomPromocaoAdmin,
  salvarCupomPromocaoAdmin,
} from "../../actions";
import type {
  CupomPromocaoAdmin,
  ResultadoCuponsPromocaoAdmin,
  TipoDescontoPromocao,
} from "../../types";

type FiltrosCuponsPromocaoAdmin = {
  busca: string;
  status: string;
  pagina: number;
};

type FormularioCupomPromocaoAdmin = {
  id?: string;
  codigo: string;
  nome: string;
  ativo: boolean;
  tipoDesconto: TipoDescontoPromocao;
  valorDesconto: number;
  prioridade: number;
  acumulativo: boolean;
  subtotalMinimo: number;
  limiteUsoTotal: number | "";
  limiteUsoPorCliente: number | "";
  dataInicio: string;
  dataFim: string;
};

type PaginaCuponsPromocaoAdminProps = {
  resultado: ResultadoCuponsPromocaoAdmin;
  filtros: FiltrosCuponsPromocaoAdmin;
};

const formularioInicial: FormularioCupomPromocaoAdmin = {
  codigo: "",
  nome: "",
  ativo: false,
  tipoDesconto: "percentual",
  valorDesconto: 10,
  prioridade: 0,
  acumulativo: false,
  subtotalMinimo: 0,
  limiteUsoTotal: "",
  limiteUsoPorCliente: "",
  dataInicio: "",
  dataFim: "",
};

function formatarPreco(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor / 100);
}

function formatarData(data: Date | string | null) {
  if (!data) return "Sem fim";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

function converterDataParaInput(data: Date | string | null) {
  if (!data) return "";
  const dataConvertida = new Date(data);
  const deslocamento = dataConvertida.getTimezoneOffset() * 60000;
  return new Date(dataConvertida.getTime() - deslocamento)
    .toISOString()
    .slice(0, 16);
}

function converterInputParaData(valor: string) {
  return valor ? new Date(valor) : null;
}

function normalizarCodigoCupom(valor: string) {
  return valor
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");
}

function normalizarValorOpcional(valor: number | "") {
  return valor === "" ? null : valor;
}

function criarFormularioPorCupom(
  cupom: CupomPromocaoAdmin,
): FormularioCupomPromocaoAdmin {
  return {
    id: cupom.id,
    codigo: cupom.codigo,
    nome: cupom.nome,
    ativo: cupom.ativo,
    tipoDesconto: cupom.tipoDesconto,
    valorDesconto: cupom.valorDesconto,
    prioridade: cupom.prioridade,
    acumulativo: cupom.acumulativo,
    subtotalMinimo: cupom.subtotalMinimo,
    limiteUsoTotal: cupom.limiteUsoTotal ?? "",
    limiteUsoPorCliente: cupom.limiteUsoPorCliente ?? "",
    dataInicio: converterDataParaInput(cupom.dataInicio),
    dataFim: converterDataParaInput(cupom.dataFim),
  };
}

function obterBadgeCupom(cupom: CupomPromocaoAdmin) {
  const agora = Date.now();
  const inicio = new Date(cupom.dataInicio).getTime();
  const fim = cupom.dataFim ? new Date(cupom.dataFim).getTime() : null;

  if (!cupom.ativo)
    return { rotulo: "Inativo", classe: "bg-zinc-100 text-zinc-700" };
  if (inicio > agora)
    return { rotulo: "Agendado", classe: "bg-amber-100 text-amber-800" };
  if (fim && fim < agora)
    return { rotulo: "Expirado", classe: "bg-slate-100 text-slate-700" };
  if (
    cupom.limiteUsoTotal !== null &&
    cupom.totalUsos >= cupom.limiteUsoTotal
  ) {
    return { rotulo: "Limite", classe: "bg-rose-100 text-rose-800" };
  }

  return { rotulo: "Ativo", classe: "bg-emerald-100 text-emerald-800" };
}

export function PaginaCuponsPromocaoAdmin({
  resultado,
  filtros,
}: PaginaCuponsPromocaoAdminProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filtrosLocais, setFiltrosLocais] = useState(filtros);
  const [formulario, setFormulario] =
    useState<FormularioCupomPromocaoAdmin>(formularioInicial);

  function atualizarFiltro(
    campo: keyof FiltrosCuponsPromocaoAdmin,
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
    if (filtrosLocais.status && filtrosLocais.status !== "todos") {
      params.set("status", filtrosLocais.status);
    }
    params.set("pagina", String(pagina));
    router.push(`/admin/marketing/cupons?${params.toString()}`);
  }

  function atualizarFormulario<
    TCampo extends keyof FormularioCupomPromocaoAdmin,
  >(campo: TCampo, valor: FormularioCupomPromocaoAdmin[TCampo]) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  function executarAcao(
    acao: () => Promise<{ success: boolean }>,
    mensagemSucesso: string,
  ) {
    startTransition(async () => {
      try {
        await acao();
        toast.success(mensagemSucesso);
        setFormulario(formularioInicial);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível concluir a ação.",
        );
      }
    });
  }

  function salvarFormulario() {
    executarAcao(
      () =>
        salvarCupomPromocaoAdmin({
          ...formulario,
          dataInicio: converterInputParaData(formulario.dataInicio),
          dataFim: converterInputParaData(formulario.dataFim),
          limiteUsoTotal: normalizarValorOpcional(formulario.limiteUsoTotal),
          limiteUsoPorCliente: normalizarValorOpcional(
            formulario.limiteUsoPorCliente,
          ),
        }),
      formulario.id ? "Cupom atualizado." : "Cupom criado.",
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-950 via-slate-950 to-cyan-950 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge className="w-fit bg-white/10 text-white hover:bg-white/10">
              Marketing
            </Badge>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">
                Cupons
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
                Gerencie códigos promocionais do Promotion Engine sem integrar
                checkout, carrinho ou visual final nesta etapa.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => setFormulario(formularioInicial)}
            className="w-full bg-white text-slate-950 hover:bg-slate-100 sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo cupom
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto]">
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={filtrosLocais.busca}
                    onChange={(event) =>
                      atualizarFiltro("busca", event.target.value)
                    }
                    placeholder="Buscar por código ou nome"
                    className="pl-9"
                  />
                </div>
                <Select
                  value={filtrosLocais.status || "todos"}
                  onValueChange={(valor) => atualizarFiltro("status", valor)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ativos">Ativos</SelectItem>
                    <SelectItem value="inativos">Inativos</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" onClick={() => aplicarFiltros(1)}>
                  Filtrar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hidden overflow-hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cupom</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Limites</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultado.cupons.map((cupom) => {
                  const badge = obterBadgeCupom(cupom);

                  return (
                    <TableRow key={cupom.id}>
                      <TableCell>
                        <p className="font-semibold text-slate-950">
                          {cupom.codigo}
                        </p>
                        <p className="text-xs text-slate-500">{cupom.nome}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={badge.classe}>{badge.rotulo}</Badge>
                      </TableCell>
                      <TableCell>
                        {cupom.tipoDesconto === "percentual"
                          ? `${cupom.valorDesconto}%`
                          : formatarPreco(cupom.valorDesconto)}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs leading-5 text-slate-600">
                          <p>
                            Usos: {cupom.totalUsos}/
                            {cupom.limiteUsoTotal ?? "∞"}
                          </p>
                          <p>
                            Cliente: {cupom.limiteUsoPorCliente ?? "sem limite"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs leading-5 text-slate-600">
                          <p>{formatarData(cupom.dataInicio)}</p>
                          <p>até {formatarData(cupom.dataFim)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{cupom.prioridade}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setFormulario(criarFormularioPorCupom(cupom))
                            }
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              executarAcao(
                                () =>
                                  alternarStatusCupomPromocaoAdmin(
                                    cupom.id,
                                    !cupom.ativo,
                                  ),
                                cupom.ativo
                                  ? "Cupom desativado."
                                  : "Cupom ativado.",
                              )
                            }
                          >
                            {cupom.ativo ? (
                              <PauseCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              executarAcao(
                                () => duplicarCupomPromocaoAdmin(cupom.id),
                                "Cupom duplicado.",
                              )
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          <div className="space-y-3 lg:hidden">
            {resultado.cupons.map((cupom) => {
              const badge = obterBadgeCupom(cupom);

              return (
                <Card key={cupom.id}>
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {cupom.codigo}
                        </p>
                        <p className="text-xs text-slate-500">{cupom.nome}</p>
                      </div>
                      <Badge className={badge.classe}>{badge.rotulo}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Desconto</p>
                        <p className="font-semibold">
                          {cupom.tipoDesconto === "percentual"
                            ? `${cupom.valorDesconto}%`
                            : formatarPreco(cupom.valorDesconto)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Usos</p>
                        <p className="font-semibold">
                          {cupom.totalUsos}/{cupom.limiteUsoTotal ?? "∞"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() =>
                          setFormulario(criarFormularioPorCupom(cupom))
                        }
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          executarAcao(
                            () => duplicarCupomPromocaoAdmin(cupom.id),
                            "Cupom duplicado.",
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border bg-white p-4 sm:flex-row">
            <p className="text-sm text-slate-600">
              Página {resultado.pagina} de {resultado.totalPaginas} ·{" "}
              {resultado.total} cupons
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={resultado.pagina <= 1}
                onClick={() => aplicarFiltros(resultado.pagina - 1)}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={resultado.pagina >= resultado.totalPaginas}
                onClick={() => aplicarFiltros(resultado.pagina + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        </div>

        <Card className="h-fit xl:sticky xl:top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TicketPercent className="h-5 w-5 text-emerald-600" />
              {formulario.id ? "Editar cupom" : "Criar cupom"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Código</Label>
                  <Input
                    value={formulario.codigo}
                    onChange={(event) =>
                      atualizarFormulario(
                        "codigo",
                        normalizarCodigoCupom(event.target.value),
                      )
                    }
                    placeholder="BEMVINDO10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={formulario.nome}
                    onChange={(event) =>
                      atualizarFormulario("nome", event.target.value)
                    }
                    placeholder="Cupom boas-vindas"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formulario.tipoDesconto}
                    onValueChange={(valor: TipoDescontoPromocao) =>
                      atualizarFormulario("tipoDesconto", valor)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentual">Percentual</SelectItem>
                      <SelectItem value="valor_fixo">Valor fixo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor desconto</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formulario.valorDesconto}
                    onChange={(event) =>
                      atualizarFormulario(
                        "valorDesconto",
                        Number(event.target.value),
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Subtotal mínimo</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formulario.subtotalMinimo}
                    onChange={(event) =>
                      atualizarFormulario(
                        "subtotalMinimo",
                        Number(event.target.value),
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formulario.prioridade}
                    onChange={(event) =>
                      atualizarFormulario(
                        "prioridade",
                        Number(event.target.value),
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Limite total</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formulario.limiteUsoTotal}
                    onChange={(event) =>
                      atualizarFormulario(
                        "limiteUsoTotal",
                        event.target.value === ""
                          ? ""
                          : Number(event.target.value),
                      )
                    }
                    placeholder="Sem limite"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Limite por cliente</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formulario.limiteUsoPorCliente}
                    onChange={(event) =>
                      atualizarFormulario(
                        "limiteUsoPorCliente",
                        event.target.value === ""
                          ? ""
                          : Number(event.target.value),
                      )
                    }
                    placeholder="Sem limite"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Input
                    type="datetime-local"
                    value={formulario.dataInicio}
                    onChange={(event) =>
                      atualizarFormulario("dataInicio", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fim</Label>
                  <Input
                    type="datetime-local"
                    value={formulario.dataFim}
                    onChange={(event) =>
                      atualizarFormulario("dataFim", event.target.value)
                    }
                  />
                </div>
              </div>

              <label className="flex items-center justify-between rounded-2xl border p-4">
                <span>
                  <span className="block text-sm font-medium">Ativo</span>
                  <span className="text-xs text-slate-500">
                    Disponível para validação no engine.
                  </span>
                </span>
                <Switch
                  checked={formulario.ativo}
                  onCheckedChange={(valor) =>
                    atualizarFormulario("ativo", valor)
                  }
                />
              </label>

              <label className="flex items-center justify-between rounded-2xl border p-4">
                <span>
                  <span className="block text-sm font-medium">Acumulativo</span>
                  <span className="text-xs text-slate-500">
                    Preparado para regras futuras.
                  </span>
                </span>
                <Switch
                  checked={formulario.acumulativo}
                  onCheckedChange={(valor) =>
                    atualizarFormulario("acumulativo", valor)
                  }
                />
              </label>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
              Cupons ficam disponíveis no Promotion Engine, mas ainda não foram
              integrados ao checkout, carrinho ou input visual.
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="flex-1"
                disabled={isPending}
                onClick={salvarFormulario}
              >
                {isPending ? "Salvando..." : "Salvar cupom"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormulario(formularioInicial)}
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
