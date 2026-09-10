"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type PontoDesempenhoNegocio = {
  periodo: string;
  receita: number;
  pedidos: number;
  lucro: number;
  conversao: number;
};

type MetricaDesempenho = "receita" | "pedidos" | "lucro" | "conversao";

type GraficoDesempenhoNegocioProps = {
  dados?: PontoDesempenhoNegocio[];
};

const dadosDesempenhoMockados: PontoDesempenhoNegocio[] = [
  {
    periodo: "01 jul",
    receita: 18200,
    pedidos: 74,
    lucro: 5400,
    conversao: 2.8,
  },
  {
    periodo: "04 jul",
    receita: 21500,
    pedidos: 89,
    lucro: 6700,
    conversao: 3.1,
  },
  {
    periodo: "07 jul",
    receita: 19800,
    pedidos: 81,
    lucro: 6100,
    conversao: 2.9,
  },
  {
    periodo: "10 jul",
    receita: 24700,
    pedidos: 101,
    lucro: 7600,
    conversao: 3.4,
  },
  {
    periodo: "13 jul",
    receita: 26300,
    pedidos: 108,
    lucro: 8200,
    conversao: 3.6,
  },
  {
    periodo: "16 jul",
    receita: 25100,
    pedidos: 103,
    lucro: 7800,
    conversao: 3.3,
  },
  {
    periodo: "19 jul",
    receita: 29400,
    pedidos: 119,
    lucro: 9300,
    conversao: 3.8,
  },
  {
    periodo: "22 jul",
    receita: 32100,
    pedidos: 132,
    lucro: 10100,
    conversao: 4.1,
  },
  {
    periodo: "25 jul",
    receita: 30700,
    pedidos: 126,
    lucro: 9600,
    conversao: 3.9,
  },
  {
    periodo: "28 jul",
    receita: 35600,
    pedidos: 144,
    lucro: 11300,
    conversao: 4.4,
  },
  {
    periodo: "31 jul",
    receita: 38200,
    pedidos: 156,
    lucro: 12400,
    conversao: 4.7,
  },
];

const configuracaoMetricas: Record<
  MetricaDesempenho,
  {
    rotulo: string;
    total: string;
    variacao: string;
    descricao: string;
    formatar: (valor: number) => string;
  }
> = {
  receita: {
    rotulo: "Receita",
    total: "R$ 38.200",
    variacao: "+18,6%",
    descricao: "Receita bruta no período",
    formatar: (valor) => `R$ ${(valor / 1000).toFixed(0)} mil`,
  },
  pedidos: {
    rotulo: "Pedidos",
    total: "156",
    variacao: "+12,4%",
    descricao: "Pedidos confirmados no período",
    formatar: (valor) => String(valor),
  },
  lucro: {
    rotulo: "Lucro",
    total: "R$ 12.400",
    variacao: "+21,2%",
    descricao: "Lucro estimado no período",
    formatar: (valor) => `R$ ${(valor / 1000).toFixed(1)} mil`,
  },
  conversao: {
    rotulo: "Conversão",
    total: "4,7%",
    variacao: "+0,8 p.p.",
    descricao: "Conversão média da loja",
    formatar: (valor) => `${valor.toFixed(1)}%`,
  },
};

export function GraficoDesempenhoNegocio({
  dados = dadosDesempenhoMockados,
}: GraficoDesempenhoNegocioProps) {
  const [metricaSelecionada, setMetricaSelecionada] =
    useState<MetricaDesempenho>("receita");
  const metrica = configuracaoMetricas[metricaSelecionada];

  const configuracaoGrafico = {
    [metricaSelecionada]: {
      label: metrica.rotulo,
      color: "var(--primary)",
    },
  } satisfies ChartConfig;

  return (
    <section className="superficie-admin overflow-hidden">
      <div className="border-border/60 flex flex-col gap-5 border-b px-5 py-5 sm:px-6 sm:py-5.5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Desempenho do negócio
          </p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
            <h3 className="text-2xl font-semibold tracking-[-0.03em] tabular-nums sm:text-[1.75rem]">
              {metrica.total}
            </h3>
            <span className="bg-success-light text-success-dark rounded-md px-1.5 py-0.5 text-xs font-semibold">
              {metrica.variacao}
            </span>
            <span className="text-muted-foreground text-xs">
              {metrica.descricao}
            </span>
          </div>
        </div>

        <Tabs
          value={metricaSelecionada}
          onValueChange={(valor) =>
            setMetricaSelecionada(valor as MetricaDesempenho)
          }
        >
          <TabsList className="border-border/60 bg-muted/55 grid h-auto w-full grid-cols-4 rounded-xl border p-1 lg:w-auto">
            {(Object.keys(configuracaoMetricas) as MetricaDesempenho[]).map(
              (chave) => (
                <TabsTrigger
                  key={chave}
                  value={chave}
                  className="rounded-lg px-2.5 py-1.5 text-xs transition-all duration-200 data-[state=active]:shadow-sm sm:px-4"
                >
                  {configuracaoMetricas[chave].rotulo}
                </TabsTrigger>
              ),
            )}
          </TabsList>
        </Tabs>
      </div>

      <div className="px-1 pt-6 pb-4 sm:px-4 sm:pt-7 sm:pb-5">
        <ChartContainer
          config={configuracaoGrafico}
          className="aspect-auto h-[290px] w-full sm:h-[340px]"
        >
          <AreaChart
            data={dados}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="preenchimento-desempenho"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="4%"
                  stopColor="var(--primary)"
                  stopOpacity={0.2}
                />
                <stop
                  offset="96%"
                  stopColor="var(--primary)"
                  stopOpacity={0.01}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="2 7"
              strokeOpacity={0.3}
            />
            <XAxis
              dataKey="periodo"
              axisLine={false}
              tickLine={false}
              tickMargin={12}
              minTickGap={28}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              width={62}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={metrica.formatar}
            />
            <ChartTooltip
              cursor={{
                stroke: "var(--primary)",
                strokeOpacity: 0.22,
                strokeDasharray: "4 5",
              }}
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(valor) => (
                    <div className="flex min-w-28 items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        {metrica.rotulo}
                      </span>
                      <span className="font-mono font-medium tabular-nums">
                        {metrica.formatar(Number(valor))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Area
              key={metricaSelecionada}
              dataKey={metricaSelecionada}
              type="monotone"
              fill="url(#preenchimento-desempenho)"
              stroke="var(--primary)"
              strokeWidth={2.5}
              activeDot={{
                r: 4.5,
                fill: "var(--primary)",
                stroke: "var(--card)",
                strokeWidth: 2,
              }}
              animationDuration={650}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </section>
  );
}
