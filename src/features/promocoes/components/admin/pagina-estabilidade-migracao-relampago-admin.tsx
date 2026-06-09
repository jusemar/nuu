import Link from "next/link";
import { ArrowLeft, ShieldCheck, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type {
  ItemEstabilidadeMigracaoRelampagoAdmin,
  ResultadoEstabilidadeMigracaoRelampagoAdmin,
} from "../../types";

type PaginaEstabilidadeMigracaoRelampagoAdminProps = {
  resultado: ResultadoEstabilidadeMigracaoRelampagoAdmin;
};

function formatarPreco(valor: number | null) {
  if (valor === null) return "-";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor / 100);
}

function formatarData(data: Date | string | null) {
  if (!data) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

function obterClasseStatus(
  status: ItemEstabilidadeMigracaoRelampagoAdmin["status"],
) {
  if (status === "estavel") return "bg-emerald-100 text-emerald-800";
  if (status === "instavel") return "bg-red-100 text-red-800";

  return "bg-amber-100 text-amber-800";
}

function obterRotuloStatus(
  status: ItemEstabilidadeMigracaoRelampagoAdmin["status"],
) {
  if (status === "estavel") return "Estável";
  if (status === "instavel") return "Instável";

  return "Precisa revisão";
}

function CartaoResumo({
  titulo,
  valor,
  descricao,
}: {
  titulo: string;
  valor: number;
  descricao: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
          {titulo}
        </p>
        <p className="mt-2 text-2xl font-semibold text-slate-950">{valor}</p>
        <p className="mt-1 text-xs text-slate-500">{descricao}</p>
      </CardContent>
    </Card>
  );
}

function LinhaEstabilidadeMobile({
  item,
}: {
  item: ItemEstabilidadeMigracaoRelampagoAdmin;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-950">{item.produto}</p>
            <p className="text-xs text-slate-500">
              SKU {item.sku || "-"} · {item.modalidade}
            </p>
          </div>
          <Badge className={obterClasseStatus(item.status)}>
            {obterRotuloStatus(item.status)}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Legado</p>
            <p className="font-semibold">
              {formatarPreco(item.precoLegadoEmCentavos)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Oficial</p>
            <p className="font-semibold">
              {formatarPreco(item.precoOficialEmCentavos)}
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
          {item.motivos.join(" ")}
        </div>
      </CardContent>
    </Card>
  );
}

export function PaginaEstabilidadeMigracaoRelampagoAdmin({
  resultado,
}: PaginaEstabilidadeMigracaoRelampagoAdminProps) {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge className="w-fit bg-white/10 text-white hover:bg-white/10">
              Verificação read-only
            </Badge>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">
                Estabilidade relâmpago
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-100">
                Confirma campanhas migradas antes de qualquer futura remoção de
                campos legados. Nenhuma correção automática é executada.
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20 sm:w-auto"
          >
            <Link href="/admin/marketing/promocoes/diagnostico-relampago">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao diagnóstico
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <CartaoResumo
          titulo="Migrados"
          valor={resultado.resumo.totalItens}
          descricao="Legados marcados"
        />
        <CartaoResumo
          titulo="Estáveis"
          valor={resultado.resumo.totalEstaveis}
          descricao="Prontos para observação"
        />
        <CartaoResumo
          titulo="Instáveis"
          valor={resultado.resumo.totalInstaveis}
          descricao="Não remover legado"
        />
        <CartaoResumo
          titulo="Revisão"
          valor={resultado.resumo.totalPrecisamRevisao}
          descricao="Exigem análise manual"
        />
      </div>

      {resultado.resumo.totalInstaveis > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col gap-3 p-4 text-sm text-red-900 sm:flex-row sm:items-center">
            <TriangleAlert className="h-5 w-5 shrink-0" />
            Existem migrações instáveis. Não remova campos legados enquanto
            houver instabilidade.
          </CardContent>
        </Card>
      )}

      {resultado.resumo.totalInstaveis === 0 &&
        resultado.resumo.totalPrecisamRevisao === 0 &&
        resultado.resumo.totalItens > 0 && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="flex flex-col gap-3 p-4 text-sm text-emerald-900 sm:flex-row sm:items-center">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              Todos os legados migrados estão estáveis nesta checagem.
            </CardContent>
          </Card>
        )}

      <Card className="hidden overflow-hidden lg:block">
        <CardHeader>
          <CardTitle>Campanhas migradas</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Modalidade</TableHead>
              <TableHead>Preços</TableHead>
              <TableHead>Countdown</TableHead>
              <TableHead>Checks</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Motivos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resultado.itens.map((item) => (
              <TableRow key={item.chave}>
                <TableCell>
                  <div>
                    <p className="font-semibold text-slate-950">
                      {item.produto}
                    </p>
                    <p className="text-xs text-slate-500">
                      SKU {item.sku || "-"} · regra{" "}
                      {item.regraPromocaoId?.slice(0, 8) ?? "-"}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{item.modalidade}</Badge>
                </TableCell>
                <TableCell className="text-xs leading-5">
                  <p>Legado {formatarPreco(item.precoLegadoEmCentavos)}</p>
                  <p>Oficial {formatarPreco(item.precoOficialEmCentavos)}</p>
                </TableCell>
                <TableCell className="text-xs leading-5">
                  <p>Legado {formatarData(item.countdownLegadoDataFim)}</p>
                  <p>Oficial {formatarData(item.countdownOficialDataFim)}</p>
                </TableCell>
                <TableCell className="text-xs leading-5">
                  <p>Oficial: {item.oficialAtiva ? "ativa" : "inativa"}</p>
                  <p>Legado usado: {item.legadoUsado ? "sim" : "não"}</p>
                  <p>
                    Stock:{" "}
                    {item.stockSemPromocao === null
                      ? "n/a"
                      : item.stockSemPromocao
                        ? "sem promoção"
                        : "com promoção"}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge className={obterClasseStatus(item.status)}>
                    {obterRotuloStatus(item.status)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs text-xs text-slate-600">
                  {item.motivos.join(" ")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="space-y-3 lg:hidden">
        {resultado.itens.map((item) => (
          <LinhaEstabilidadeMobile key={item.chave} item={item} />
        ))}
      </div>
    </section>
  );
}
