"use client";

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Box,
  CheckCircle2,
  Clock3,
  FileText,
  Layers3,
  Plug,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import type { ConfiguracaoLaquilaAdmin } from "../../types";

import { FormularioConfiguracaoLaquila } from "./formulario-configuracao-laquila";

const metricasLaquila = [
  {
    titulo: "Itens disponíveis",
    valor: "100",
    detalhe: "última consulta",
    icone: Box,
    tom: "bg-blue-50 text-blue-700",
  },
  {
    titulo: "Novos",
    valor: "24",
    detalhe: "aguardando revisão",
    icone: Layers3,
    tom: "bg-emerald-50 text-emerald-700",
  },
  {
    titulo: "Sincronizações",
    valor: "7",
    detalhe: "este mês",
    icone: RefreshCcw,
    tom: "bg-slate-100 text-slate-700",
  },
  {
    titulo: "Alertas",
    valor: "2",
    detalhe: "atenção",
    icone: AlertTriangle,
    tom: "bg-amber-50 text-amber-700",
  },
];

const atividadesRecentes = [
  {
    titulo: "Teste de conexão realizado",
    detalhe: "credenciais válidas",
    tempo: "há 12 min",
    icone: CheckCircle2,
    tom: "text-emerald-600",
  },
  {
    titulo: "Sincronização concluída",
    detalhe: "catálogo atualizado",
    tempo: "há 34 min",
    icone: RefreshCcw,
    tom: "text-blue-600",
  },
  {
    titulo: "100 itens recebidos",
    detalhe: "método 00007",
    tempo: "hoje",
    icone: Box,
    tom: "text-slate-600",
  },
  {
    titulo: "Token atualizado",
    detalhe: "configuração salva",
    tempo: "ontem",
    icone: ShieldCheck,
    tom: "text-slate-600",
  },
  {
    titulo: "Sem erro crítico",
    detalhe: "últimas 24h",
    tempo: "agora",
    icone: ShieldCheck,
    tom: "text-emerald-600",
  },
];

const acessosRapidos = [
  {
    titulo: "Catálogo API",
    detalhe: "prévia de itens",
    icone: Box,
  },
  {
    titulo: "Sincronizações",
    detalhe: "histórico",
    icone: RefreshCcw,
  },
  {
    titulo: "Logs",
    detalhe: "eventos técnicos",
    icone: FileText,
  },
];

type PaginaIntegracaoLaquilaAdminProps = {
  configuracao: ConfiguracaoLaquilaAdmin | null;
};

export function PaginaIntegracaoLaquilaAdmin({
  configuracao,
}: PaginaIntegracaoLaquilaAdminProps) {
  const conectado = Boolean(configuracao?.tokenConfigurado);
  const ultimoTeste = configuracao?.ultimoTesteEm
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(configuracao.ultimoTesteEm))
    : "Ainda não testado";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-xs sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>Integrações</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>Fornecedores API</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Laquila</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mt-4">
            <h1 className="text-2xl font-semibold text-slate-950">Laquila</h1>
            <p className="mt-1 text-sm text-slate-600">
              Painel da integração com fornecedor API
            </p>
          </div>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className={`flex w-full items-center justify-between gap-4 rounded-lg border px-4 py-3 text-left transition sm:w-[260px] ${
                conectado
                  ? "border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:bg-emerald-100/70"
                  : "border-amber-200 bg-amber-50 hover:border-amber-300 hover:bg-amber-100/70"
              }`}
              aria-label="Abrir configuração da conexão Laquila"
            >
              <span className="flex items-center gap-3">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-md bg-white shadow-xs ${
                    conectado ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  <Plug className="h-4 w-4" />
                </span>
                <span>
                  <span
                    className={`block text-sm font-semibold ${
                      conectado ? "text-emerald-900" : "text-amber-900"
                    }`}
                  >
                    {conectado ? "Conectado" : "Desconectado"}
                  </span>
                  <span
                    className={`text-xs ${
                      conectado ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    Configurar conexão
                  </span>
                </span>
              </span>
              <ArrowUpRight
                className={`h-4 w-4 ${
                  conectado ? "text-emerald-700" : "text-amber-700"
                }`}
              />
            </button>
          </SheetTrigger>

          <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-lg">
            <SheetHeader className="border-b px-5 py-4 text-left">
              <SheetTitle>Conexão Laquila</SheetTitle>
              <SheetDescription>
                Credenciais editáveis da integração API
              </SheetDescription>
            </SheetHeader>

            <div className="px-5 pt-5">
              <div
                className={`rounded-lg border p-3 ${
                  conectado
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div
                  className={`flex items-center gap-2 text-sm font-medium ${
                    conectado ? "text-emerald-900" : "text-amber-900"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {conectado ? "Conectado" : "Desconectado"}
                </div>
                <p
                  className={`mt-1 text-xs ${
                    conectado ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  Último teste: {ultimoTeste}
                </p>
              </div>
            </div>

            <FormularioConfiguracaoLaquila
              configuracao={configuracao}
              modo="drawer"
            />

            <SheetFooter className="border-t px-5 py-4">
              <p className="text-xs text-slate-500">
                Os dados salvos serão usados nas próximas chamadas da API.
              </p>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricasLaquila.map((metrica) => {
          const Icone = metrica.icone;

          return (
            <Card key={metrica.titulo} className="rounded-lg py-4 shadow-xs">
              <CardContent className="flex items-center justify-between gap-3 px-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    {metrica.titulo}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-950">
                    {metrica.valor}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {metrica.detalhe}
                  </p>
                </div>
                <div className={`rounded-md p-2 ${metrica.tom}`}>
                  <Icone className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-lg py-0 shadow-xs">
          <CardHeader className="border-b px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Atividade recente</CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  Eventos deste fornecedor
                </p>
              </div>
              <Badge variant="outline" className="gap-1.5">
                <Clock3 className="h-3 w-3" />
                24h
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 py-2">
            <div className="divide-y divide-slate-100">
              {atividadesRecentes.map((atividade) => {
                const Icone = atividade.icone;

                return (
                  <div
                    key={atividade.titulo}
                    className="flex items-start gap-3 py-4"
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-50">
                      <Icone className={`h-4 w-4 ${atividade.tom}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="truncate text-sm font-medium text-slate-950">
                          {atividade.titulo}
                        </p>
                        <span className="shrink-0 text-xs text-slate-500">
                          {atividade.tempo}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {atividade.detalhe}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg py-0 shadow-xs">
          <CardHeader className="border-b px-5 py-4">
            <CardTitle className="text-base">Acessos rápidos</CardTitle>
            <p className="text-sm text-slate-500">Áreas da integração</p>
          </CardHeader>
          <CardContent className="grid gap-3 px-5 py-5">
            {acessosRapidos.map((acesso) => {
              const Icone = acesso.icone;
              const conteudo = (
                <>
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                      <Icone className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-950">
                        {acesso.titulo}
                      </span>
                      <span className="text-xs text-slate-500">
                        {acesso.detalhe}
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400" />
                </>
              );

              if (acesso.titulo === "Catálogo API") {
                return (
                  <Link
                    key={acesso.titulo}
                    href="/admin/fornecedores/integracoes/laquila/produtos"
                    prefetch={false}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    {conteudo}
                  </Link>
                );
              }

              return (
                <button
                  key={acesso.titulo}
                  type="button"
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                  disabled
                >
                  {conteudo}
                </button>
              );
            })}

            <Separator />

            <div className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                <Activity className="h-4 w-4 text-slate-500" />
                Operação estável
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Sem falhas críticas recentes.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

    </main>
  );
}
