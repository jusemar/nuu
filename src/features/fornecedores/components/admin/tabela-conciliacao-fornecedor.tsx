"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileWarning,
  PackageCheck,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type TipoOrigemConciliacaoFornecedor = "arquivo" | "api";

export type StatusConciliacaoFornecedor =
  | "pronto"
  | "pendencia"
  | "alerta"
  | "ignorado";

export type AcaoPrevistaConciliacaoFornecedor =
  | "criar"
  | "atualizar"
  | "ignorar";

export type ItemConciliacaoFornecedor = {
  id: string;
  produto: {
    nome: string;
    codigo?: string | null;
    preco?: string | null;
    estoque?: number | null;
    complemento?: string | null;
  };
  acaoPrevista: AcaoPrevistaConciliacaoFornecedor;
  status: StatusConciliacaoFornecedor;
  pendenciasObrigatorias?: string[];
  alertas?: string[];
  motivoIgnorado?: string | null;
};

type TabelaConciliacaoFornecedorProps = {
  tipoOrigem: TipoOrigemConciliacaoFornecedor;
  fornecedor: string;
  titulo: string;
  subtitulo: string;
  hrefVoltar: string;
  textoVoltar?: string;
  hrefProximaEtapa?: string;
  textoAcaoPrincipal?: string;
  itens: ItemConciliacaoFornecedor[];
};

type FiltroConciliacaoFornecedor =
  | "todos"
  | "prontos"
  | "pendencias"
  | "alertas"
  | "ignorados";

function formatarMoeda(valor?: string | null) {
  if (!valor) return null;

  const numero = Number(valor);
  if (!Number.isFinite(numero)) return null;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numero);
}

function rotuloAcaoPrevista(acao: AcaoPrevistaConciliacaoFornecedor) {
  const rotulos: Record<AcaoPrevistaConciliacaoFornecedor, string> = {
    criar: "Criar novo",
    atualizar: "Atualizar",
    ignorar: "Ignorar",
  };

  return rotulos[acao];
}

function classeStatus(status: StatusConciliacaoFornecedor) {
  const classes: Record<StatusConciliacaoFornecedor, string> = {
    pronto: "border-emerald-200 bg-emerald-50 text-emerald-700",
    pendencia: "border-amber-200 bg-amber-50 text-amber-700",
    alerta: "border-orange-200 bg-orange-50 text-orange-700",
    ignorado: "border-slate-200 bg-slate-100 text-slate-600",
  };

  return classes[status];
}

function rotuloStatus(status: StatusConciliacaoFornecedor) {
  const rotulos: Record<StatusConciliacaoFornecedor, string> = {
    pronto: "Pronto",
    pendencia: "Pendência",
    alerta: "Alerta",
    ignorado: "Ignorado",
  };

  return rotulos[status];
}

function resumoProduto(item: ItemConciliacaoFornecedor) {
  const partes = [
    item.produto.codigo ? `Código ${item.produto.codigo}` : null,
    formatarMoeda(item.produto.preco),
    typeof item.produto.estoque === "number"
      ? `Estoque ${item.produto.estoque}`
      : null,
  ].filter(Boolean);

  return partes.length > 0 ? partes.join(" · ") : "Sem dados auxiliares";
}

function calcularResumo(itens: ItemConciliacaoFornecedor[]) {
  return {
    prontos: itens.filter((item) => item.status === "pronto").length,
    pendencias: itens.filter((item) => item.status === "pendencia").length,
    alertas: itens.filter((item) => item.status === "alerta").length,
    ignorados: itens.filter((item) => item.status === "ignorado").length,
  };
}

function deveExibirItem(
  item: ItemConciliacaoFornecedor,
  filtro: FiltroConciliacaoFornecedor,
) {
  if (filtro === "todos") return true;
  if (filtro === "prontos") return item.status === "pronto";
  if (filtro === "pendencias") return item.status === "pendencia";
  if (filtro === "alertas") return item.status === "alerta";
  return item.status === "ignorado";
}

function SeletorCorrecao({ bloqueado }: { bloqueado?: boolean }) {
  return (
    <select
      disabled={bloqueado}
      defaultValue=""
      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-xs disabled:bg-slate-50 disabled:text-slate-400"
    >
      <option value="">Selecionar categoria</option>
      <option value="suspensao">Suspensão</option>
      <option value="freios">Freios</option>
      <option value="filtros">Filtros</option>
      <option value="injecao">Injeção</option>
    </select>
  );
}

function CelulaCorrecao({ item }: { item: ItemConciliacaoFornecedor }) {
  if (item.status === "pendencia") {
    return (
      <div className="space-y-1.5">
        <SeletorCorrecao />
        <p className="text-xs text-slate-500">Correção visual nesta etapa.</p>
      </div>
    );
  }

  if (item.status === "ignorado") {
    return <span className="text-sm text-slate-400">Sem correção</span>;
  }

  return (
    <Button type="button" size="sm" variant="outline" className="h-8">
      <Eye className="mr-2 h-4 w-4" />
      Ver detalhes
    </Button>
  );
}

export function TabelaConciliacaoFornecedor({
  tipoOrigem,
  fornecedor,
  titulo,
  subtitulo,
  hrefVoltar,
  textoVoltar = "Voltar para Vínculos",
  hrefProximaEtapa,
  textoAcaoPrincipal = "Continuar para publicação",
  itens,
}: TabelaConciliacaoFornecedorProps) {
  const [filtro, setFiltro] = useState<FiltroConciliacaoFornecedor>("todos");
  const resumo = useMemo(() => calcularResumo(itens), [itens]);
  const itensFiltrados = useMemo(
    () => itens.filter((item) => deveExibirItem(item, filtro)),
    [filtro, itens],
  );
  const totalPendencias = resumo.pendencias;
  const possuiPendencias = totalPendencias > 0;
  const origem = tipoOrigem === "api" ? "API" : "Arquivo";
  const filtros: Array<{
    valor: FiltroConciliacaoFornecedor;
    label: string;
    total: number;
  }> = [
    { valor: "todos", label: "Todos", total: itens.length },
    { valor: "prontos", label: "Prontos", total: resumo.prontos },
    {
      valor: "pendencias",
      label: "Pendências obrigatórias",
      total: resumo.pendencias,
    },
    { valor: "alertas", label: "Alertas", total: resumo.alertas },
    { valor: "ignorados", label: "Ignorados", total: resumo.ignorados },
  ];

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
              <Link href={hrefVoltar}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {textoVoltar}
              </Link>
            </Button>
            <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl">
              {titulo}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitulo}</p>
          </div>

          <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm sm:grid-cols-2 lg:min-w-[360px]">
            <div>
              <p className="text-xs text-slate-500">Fornecedor</p>
              <p className="font-medium text-slate-900">{fornecedor}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Origem</p>
              <p className="font-medium text-slate-900">{origem}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Itens recebidos</p>
              <p className="font-medium text-slate-900">{itens.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Status da etapa</p>
              <p className="font-medium text-slate-900">
                {possuiPendencias ? "Bloqueada" : "Liberada"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-lg">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Prontos para publicar
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {resumo.prontos}
              </p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </CardContent>
        </Card>
        <Card className="rounded-lg border-amber-200 bg-amber-50/60">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-amber-700">
                Pendências obrigatórias
              </p>
              <p className="mt-1 text-2xl font-semibold text-amber-950">
                {resumo.pendencias}
              </p>
            </div>
            <FileWarning className="h-5 w-5 text-amber-600" />
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-slate-500">Alertas</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {resumo.alertas}
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-slate-500">Ignorados</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {resumo.ignorados}
              </p>
            </div>
            <PackageCheck className="h-5 w-5 text-slate-500" />
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2">
        {filtros.map((item) => (
          <button
            key={item.valor}
            type="button"
            onClick={() => setFiltro(item.valor)}
            className={`inline-flex min-w-max items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
              filtro === item.valor
                ? "bg-slate-950 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {item.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                filtro === item.valor
                  ? "bg-white/15 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {item.total}
            </span>
          </button>
        ))}
      </div>

      {possuiPendencias ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-amber-950">
                Pendências obrigatórias
              </h2>
              <p className="mt-1 text-sm text-amber-800">
                Produtos com pendências obrigatórias não podem ser publicados.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-amber-900">
                <Checkbox />
                Selecionar todos
              </label>
              <Button type="button" size="sm" variant="outline">
                Aplicar categoria em lote
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white lg:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="w-[34%]">Produto</TableHead>
              <TableHead className="w-[16%]">Ação prevista</TableHead>
              <TableHead className="w-[25%]">Pendência/Status</TableHead>
              <TableHead className="w-[25%]">Correção</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itensFiltrados.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {item.produto.nome}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {resumoProduto(item)}
                    </p>
                    {item.produto.complemento ? (
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {item.produto.complemento}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {rotuloAcaoPrevista(item.acaoPrevista)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1.5">
                    <Badge
                      variant="outline"
                      className={classeStatus(item.status)}
                    >
                      {rotuloStatus(item.status)}
                    </Badge>
                    {item.status === "pendencia" ? (
                      <p className="text-xs text-amber-700">
                        {(item.pendenciasObrigatorias ?? []).join(", ")}
                      </p>
                    ) : null}
                    {item.status === "alerta" ? (
                      <p className="text-xs text-orange-700">
                        {(item.alertas ?? []).join(", ")}
                      </p>
                    ) : null}
                    {item.status === "ignorado" ? (
                      <p className="text-xs text-slate-500">
                        {item.motivoIgnorado ??
                          "Marcado como ignorado na vinculação"}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <CelulaCorrecao item={item} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {itensFiltrados.map((item) => (
          <article
            key={item.id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-950">
                  {item.produto.nome}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {resumoProduto(item)}
                </p>
              </div>
              <Badge variant="outline" className={classeStatus(item.status)}>
                {rotuloStatus(item.status)}
              </Badge>
            </div>
            <div className="mt-3 grid gap-2 text-sm">
              <div>
                <p className="text-xs text-slate-500">Ação prevista</p>
                <p className="font-medium text-slate-900">
                  {rotuloAcaoPrevista(item.acaoPrevista)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Pendência/Status</p>
                <p className="font-medium text-slate-900">
                  {item.status === "pendencia"
                    ? (item.pendenciasObrigatorias ?? []).join(", ")
                    : item.status === "alerta"
                      ? (item.alertas ?? []).join(", ")
                      : item.status === "ignorado"
                        ? (item.motivoIgnorado ??
                          "Marcado como ignorado na vinculação")
                        : "Pronto"}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-500">Correção</p>
                <CelulaCorrecao item={item} />
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <p
          className={`text-sm font-medium ${
            possuiPendencias ? "text-amber-700" : "text-emerald-700"
          }`}
        >
          {possuiPendencias
            ? `Não é possível publicar ainda. Existem ${totalPendencias} produtos com pendências obrigatórias.`
            : "Todos os itens obrigatórios foram corrigidos."}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href={hrefVoltar}>Voltar para vínculos</Link>
          </Button>
          {possuiPendencias || !hrefProximaEtapa ? (
            <Button type="button" disabled>
              Publicação bloqueada
            </Button>
          ) : (
            <Button asChild>
              <Link href={hrefProximaEtapa}>{textoAcaoPrincipal}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
