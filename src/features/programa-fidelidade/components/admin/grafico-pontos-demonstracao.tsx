import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

import { TENDENCIA_PONTOS_MOCK } from "../../constants/dados-demonstracao";

export function GraficoPontosDemonstracao() {
  return (
    <section className="bg-card overflow-hidden rounded-xl border shadow-sm">
      <div className="bg-muted/50 flex items-baseline justify-between border-b px-5 py-3">
        <h3 className="text-sm font-semibold">Pontos emitidos</h3>
        <span className="text-muted-foreground text-xs">exemplo · 6 meses</span>
      </div>
      <div className="h-40 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={TENDENCIA_PONTOS_MOCK}
            margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="pontos-fidelidade"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="var(--primary)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="100%"
                  stopColor="var(--primary)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="mes"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              stroke="var(--muted-foreground)"
            />
            <Tooltip
              formatter={(valor: number) => [
                valor.toLocaleString("pt-BR"),
                "pontos",
              ]}
              contentStyle={{
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--popover)",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="pontos"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#pontos-fidelidade)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
