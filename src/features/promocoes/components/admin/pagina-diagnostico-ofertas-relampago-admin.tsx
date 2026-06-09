import Link from "next/link";
import { AlertTriangle, ArrowLeft, Clock, Zap } from "lucide-react";

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
  ItemDiagnosticoOfertaRelampagoAdmin,
  ResultadoDiagnosticoOfertasRelampagoAdmin,
} from "../../types";

type PaginaDiagnosticoOfertasRelampagoAdminProps = {
  resultado: ResultadoDiagnosticoOfertasRelampagoAdmin;
};

function formatarPreco(valor: number | null) {
  if (valor === null) return "-";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor / 100);
}

function formatarData(data: Date | string | null) {
  if (!data) return "Sem countdown";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

function obterClasseOrigem(
  origem: ItemDiagnosticoOfertaRelampagoAdmin["origem"],
) {
  if (origem === "oficial") return "bg-orange-100 text-orange-800";
  if (origem === "legado") return "bg-blue-100 text-blue-800";
  return "bg-slate-100 text-slate-700";
}

function obterRotuloOrigem(
  origem: ItemDiagnosticoOfertaRelampagoAdmin["origem"],
) {
  if (origem === "oficial") return "Oficial";
  if (origem === "legado") return "Legado";
  return "Sem promoção";
}

function obterClasseStatus(
  status: ItemDiagnosticoOfertaRelampagoAdmin["status"],
) {
  if (status === "divergente") return "bg-red-100 text-red-800";
  if (status === "oficial_validado") return "bg-emerald-100 text-emerald-800";
  if (status === "legado_migrado") return "bg-teal-100 text-teal-800";
  if (status === "sem_promocao") return "bg-slate-100 text-slate-700";
  return "bg-blue-100 text-blue-800";
}

function obterRotuloStatus(
  item: Pick<
    ItemDiagnosticoOfertaRelampagoAdmin,
    "status" | "legado" | "oficial"
  >,
) {
  if (item.status === "oficial_validado") return "Oficial validado";
  if (item.status === "legado_migrado") return "Legado migrado";
  if (item.status === "sem_promocao") return "Sem promoção";
  if (item.status === "usando_legado" && item.legado.ativo) {
    return "Usando legado";
  }
  return "Divergente";
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

function LinhaDiagnosticoMobile({
  item,
}: {
  item: ItemDiagnosticoOfertaRelampagoAdmin;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-950">{item.produto}</p>
            <p className="text-xs text-slate-500">
              SKU {item.sku} · {item.modalidade}
            </p>
          </div>
          <Badge className={obterClasseStatus(item.status)}>
            {obterRotuloStatus(item)}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className={obterClasseOrigem(item.origem)}>
            {obterRotuloOrigem(item.origem)}
          </Badge>
          {item.produtoVariavel && <Badge variant="outline">Variante</Badge>}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Original</p>
            <p className="font-semibold">
              {formatarPreco(item.precoOriginalEmCentavos)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Promocional</p>
            <p className="font-semibold">
              {formatarPreco(item.precoPromocionalEmCentavos)}
            </p>
          </div>
        </div>
        <p className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
          {item.motivo}
        </p>
      </CardContent>
    </Card>
  );
}

export function PaginaDiagnosticoOfertasRelampagoAdmin({
  resultado,
}: PaginaDiagnosticoOfertasRelampagoAdminProps) {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div className="overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-br from-slate-950 via-orange-950 to-slate-900 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge className="w-fit bg-white/10 text-white hover:bg-white/10">
              Diagnóstico read-only
            </Badge>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">
                Ofertas relâmpago
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-orange-100">
                Comparação entre campanha relâmpago oficial do Promotion Engine
                e fallback legado. Nenhuma correção automática é aplicada.
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20 sm:w-auto"
          >
            <Link href="/admin/marketing/promocoes">
              <ArrowLeft className="h-4 w-4" />
              Voltar para promoções
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20 sm:w-auto"
          >
            <Link href="/admin/marketing/promocoes/estabilidade-relampago">
              Ver estabilidade
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <CartaoResumo
          titulo="Itens"
          valor={resultado.resumo.totalItens}
          descricao="Preços avaliados"
        />
        <CartaoResumo
          titulo="Oficiais"
          valor={resultado.resumo.totalOficiais}
          descricao="Relâmpago no engine"
        />
        <CartaoResumo
          titulo="Legados"
          valor={resultado.resumo.totalLegados}
          descricao="Fallback ativo"
        />
        <CartaoResumo
          titulo="Sem promoção"
          valor={resultado.resumo.totalSemPromocao}
          descricao="Sem relâmpago ativo"
        />
        <CartaoResumo
          titulo="Validados"
          valor={resultado.resumo.totalOficiaisValidados}
          descricao="Prontos para migrar"
        />
        <CartaoResumo
          titulo="Migrados"
          valor={resultado.resumo.totalLegadosMigrados}
          descricao="Legado neutralizado"
        />
        <CartaoResumo
          titulo="Usando legado"
          valor={resultado.resumo.totalUsandoLegado}
          descricao="Fallback preservado"
        />
        <CartaoResumo
          titulo="Divergências"
          valor={resultado.resumo.totalDivergentes}
          descricao="Exigem análise manual"
        />
      </div>

      {resultado.resumo.totalDivergentes > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col gap-3 p-4 text-sm text-red-900 sm:flex-row sm:items-center">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            Existem divergências entre oficial e legado. Esta tela apenas
            informa; nenhum fluxo antigo foi alterado.
          </CardContent>
        </Card>
      )}

      <Card className="hidden overflow-hidden lg:block">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-600" />
            Comparação oficial x legado
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Modalidade</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Badge</TableHead>
              <TableHead>Countdown</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Motivo</TableHead>
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
                      SKU {item.sku || "-"} · {item.slug}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge variant="outline">{item.modalidade}</Badge>
                    {item.varianteId && (
                      <p className="text-xs text-slate-500">
                        Variante {item.varianteId.slice(0, 8)}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs leading-5">
                    <p>
                      Original {formatarPreco(item.precoOriginalEmCentavos)}
                    </p>
                    <p>
                      Promo {formatarPreco(item.precoPromocionalEmCentavos)}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{item.badge ?? "-"}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-xs">
                    <Clock className="h-3.5 w-3.5" />
                    {formatarData(item.countdownDataFim)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge className={obterClasseOrigem(item.origem)}>
                    {obterRotuloOrigem(item.origem)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={obterClasseStatus(item.status)}>
                    {obterRotuloStatus(item)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs text-xs text-slate-600">
                  {item.motivo}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="space-y-3 lg:hidden">
        {resultado.itens.map((item) => (
          <LinhaDiagnosticoMobile key={item.chave} item={item} />
        ))}
      </div>
    </section>
  );
}
