import React from "react";
import Link from "next/link";
import {
  Activity,
  BadgeHelp,
  Box,
  Check,
  ClipboardCheck,
  Layers3,
  Package,
  Plug,
  Route,
  Store,
  Tags,
  Truck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type EtapaFrete = {
  titulo: string;
  estado: "concluida" | "atual" | "pendente";
};

type ItemProntidao = {
  texto: string;
  detalhe?: string;
  pronto: boolean;
};

type TransportadoraResumo = {
  id: string;
  nome: string;
  ativo: boolean;
};

type ServicoResumo = {
  id: string;
  nome: string;
  ativo: boolean;
  transportadoraFreteId: string | null;
  transportadoraNome: string | null;
};

type StatusIntegracaoFrenetResumo = {
  ativo: boolean;
  tokenConfigurado: boolean;
  cepOrigem: string | null;
  ultimaCotacaoTeste: string | null;
};

const coresSecao = {
  azul: "bg-blue-50 text-blue-700 border-blue-100",
  verde: "bg-emerald-50 text-emerald-700 border-emerald-100",
  amarelo: "bg-amber-50 text-amber-700 border-amber-100",
  violeta: "bg-violet-50 text-violet-700 border-violet-100",
  coral: "bg-orange-50 text-orange-700 border-orange-100",
  neutro: "bg-stone-100 text-stone-700 border-stone-200",
};

export const iconesSecoesFrete = {
  frenet: Plug,
  transportadoras: Truck,
  servicos: Package,
  categoria: Layers3,
  tipo: Tags,
  produto: Box,
  retirada: Store,
};

export function AjudaOperacional({ texto }: { texto: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          aria-label="Ajuda"
          className="text-muted-foreground hover:bg-muted inline-flex size-7 items-center justify-center rounded-full border"
        >
          <BadgeHelp className="size-3.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-64 leading-relaxed">
        {texto}
      </TooltipContent>
    </Tooltip>
  );
}

export function CabecalhoFreteOperacional() {
  return (
    <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="space-y-1">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
          Logística
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Transportadoras e integrações
        </h1>
        <p className="text-muted-foreground max-w-3xl text-sm">
          Configure a Frenet, valide o catálogo de frete externo e mantenha as
          regras operacionais em ordem para a cotação.
        </p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link href="/admin/logistica/integracoes">Voltar para integrações</Link>
      </Button>
    </header>
  );
}

export function BarraEtapasFrete({ etapas }: { etapas: EtapaFrete[] }) {
  return (
    <nav
      aria-label="Etapas de configuração logística"
      className="bg-background grid overflow-hidden rounded-lg border sm:grid-cols-2 xl:grid-cols-5"
    >
      {etapas.map((etapa, indice) => (
        <div
          key={etapa.titulo}
          className={[
            "border-b p-3 text-sm last:border-b-0 sm:border-r sm:last:border-r-0 xl:border-b-0",
            etapa.estado === "concluida" ? "bg-emerald-50/70" : "",
            etapa.estado === "atual" ? "bg-lime-50" : "",
          ].join(" ")}
        >
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            {etapa.estado === "concluida" ? (
              <Check className="size-3 text-emerald-700" />
            ) : null}
            <span>Etapa {indice + 1}</span>
          </div>
          <div className="mt-1 font-medium">{etapa.titulo}</div>
        </div>
      ))}
    </nav>
  );
}

export function SecaoFreteOperacional({
  valor,
  numero,
  titulo,
  descricao,
  ajuda,
  contador,
  cor = "neutro",
  icone: Icone,
  aberta = false,
  children,
}: {
  valor: string;
  numero: number;
  titulo: string;
  descricao: string;
  ajuda: string;
  contador?: React.ReactNode;
  cor?: keyof typeof coresSecao;
  icone: React.ComponentType<{ className?: string }>;
  aberta?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={aberta}
      className="group bg-background rounded-lg border px-0 shadow-sm"
    >
      <summary className="hover:bg-muted/40 flex cursor-pointer list-none items-start justify-between rounded-t-lg px-4 py-3">
        <span className="flex min-w-0 items-start gap-3 text-left">
          <span
            className={[
              "flex size-8 shrink-0 items-center justify-center rounded-md border",
              coresSecao[cor],
            ].join(" ")}
          >
            <Icone className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="bg-muted text-muted-foreground inline-flex size-5 items-center justify-center rounded-full text-xs font-medium">
                {numero}
              </span>
              <span className="font-medium">{titulo}</span>
              <AjudaOperacional texto={ajuda} />
            </span>
            <span className="text-muted-foreground mt-1 block text-xs">
              {descricao}
            </span>
          </span>
        </span>
        <span className="ml-3 shrink-0">{contador}</span>
      </summary>
      <div className="grid grid-rows-[0fr] transition-all duration-300 group-open:grid-rows-[1fr]">
        <div className="overflow-hidden">
          <div className="border-t px-4 pb-4">{children}</div>
        </div>
      </div>
    </details>
  );
}

export function ResumoOperacionalFrete({
  pronto,
  pendencias,
  statusIntegracaoFrenet,
  transportadoras,
  servicos,
  quantidadeRegrasCategoria,
  quantidadeRegrasTipo,
  quantidadeRegrasProduto,
}: {
  pronto: boolean;
  pendencias: string[];
  statusIntegracaoFrenet: StatusIntegracaoFrenetResumo;
  transportadoras: TransportadoraResumo[];
  servicos: ServicoResumo[];
  quantidadeRegrasCategoria: number;
  quantidadeRegrasTipo: number;
  quantidadeRegrasProduto: number;
}) {
  const servicosAtivos = servicos.filter((servico) => servico.ativo);
  const itensProntidao: ItemProntidao[] = [
    {
      texto: "Frenet ativa",
      pronto: statusIntegracaoFrenet.ativo,
    },
    {
      texto: "Token configurado",
      pronto: statusIntegracaoFrenet.tokenConfigurado,
    },
    {
      texto: "CEP de origem configurado",
      pronto: Boolean(statusIntegracaoFrenet.cepOrigem),
    },
    {
      texto: "Transportadora ativa",
      detalhe: "Ao menos uma vinculada ao provedor ativo.",
      pronto: transportadoras.some((transportadora) => transportadora.ativo),
    },
    {
      texto: "Serviço ativo",
      detalhe: "Ao menos uma opção válida para cotação.",
      pronto: servicosAtivos.length > 0,
    },
  ];

  const servicosPorTransportadora = transportadoras.map((transportadora) => ({
    transportadora,
    servicos: servicos.filter(
      (servico) => servico.transportadoraFreteId === transportadora.id,
    ),
  }));

  return (
    <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="size-4" />
            Prontidão operacional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Badge variant={pronto ? "default" : "destructive"}>
            {pronto ? "Base pronta para validação" : "Base incompleta"}
          </Badge>
          <div className="space-y-2">
            {itensProntidao.map((item) => (
              <div key={item.texto} className="flex gap-2 text-sm">
                <span
                  className={
                    item.pronto
                      ? "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
                      : "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700"
                  }
                >
                  {item.pronto ? "✓" : "!"}
                </span>
                <span>
                  <span className="block font-medium">{item.texto}</span>
                  {item.detalhe ? (
                    <span className="text-muted-foreground text-xs">
                      {item.detalhe}
                    </span>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
          {pendencias.length > 0 ? (
            <div className="space-y-2 border-t pt-3">
              {pendencias.map((pendencia) => (
                <p key={pendencia} className="text-muted-foreground text-xs">
                  {pendencia}
                </p>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="size-4" />
            Diagnóstico da API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <LinhaResumo
            rotulo="Frenet"
            valor={statusIntegracaoFrenet.ativo ? "Ativa" : "Inativa"}
          />
          <LinhaResumo
            rotulo="Token"
            valor={
              statusIntegracaoFrenet.tokenConfigurado
                ? "Configurado"
                : "Pendente"
            }
          />
          <LinhaResumo
            rotulo="CEP origem"
            valor={statusIntegracaoFrenet.cepOrigem ?? "Não configurado"}
          />
          <LinhaResumo
            rotulo="Última cotação"
            valor={
              statusIntegracaoFrenet.ultimaCotacaoTeste ?? "Não disponível"
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Tags className="size-4" />
            Serviços ativos por transportadora
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {servicosPorTransportadora.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhuma transportadora cadastrada.
            </p>
          ) : (
            servicosPorTransportadora.map(({ transportadora, servicos }) => (
              <div key={transportadora.id} className="space-y-2">
                <p className="text-muted-foreground text-xs">
                  {transportadora.nome}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {servicos.length === 0 ? (
                    <Badge variant="outline">Sem serviços</Badge>
                  ) : (
                    servicos.map((servico) => (
                      <Badge
                        key={servico.id}
                        variant={servico.ativo ? "default" : "secondary"}
                      >
                        {servico.nome}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Route className="size-4" />
            Prioridade das regras
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <PrioridadeRegra
            titulo="Produto específico"
            descricao={`${quantidadeRegrasProduto} regra(s). Sempre vence.`}
          />
          <PrioridadeRegra
            titulo="Tipo / classificação"
            descricao={`${quantidadeRegrasTipo} regra(s). Vence categoria.`}
          />
          <PrioridadeRegra
            titulo="Categoria"
            descricao={`${quantidadeRegrasCategoria} regra(s). Base operacional.`}
          />
          <p className="text-muted-foreground border-t pt-3 text-xs">
            Dentro da mesma camada, bloqueio vence permissão.
          </p>
        </CardContent>
      </Card>
    </aside>
  );
}

function LinhaResumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{rotulo}</span>
      <span className="text-right font-medium">{valor}</span>
    </div>
  );
}

function PrioridadeRegra({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="bg-muted/30 rounded-md border p-3">
      <p className="font-medium">{titulo}</p>
      <p className="text-muted-foreground mt-1 text-xs">{descricao}</p>
    </div>
  );
}
