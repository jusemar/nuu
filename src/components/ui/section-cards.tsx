import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";

const indicadores = [
  {
    titulo: "Vendas líquidas",
    valor: "R$ 12.234",
    variacao: "+19%",
    contexto: "vs. período anterior",
    positivo: true,
    icon: CircleDollarSign,
  },
  {
    titulo: "Pedidos",
    valor: "573",
    variacao: "+8,4%",
    contexto: "46 aguardando envio",
    positivo: true,
    icon: ShoppingBag,
  },
  {
    titulo: "Ticket médio",
    valor: "R$ 213,50",
    variacao: "-2,1%",
    contexto: "vs. período anterior",
    positivo: false,
    icon: Users,
  },
  {
    titulo: "Produtos ativos",
    valor: "1.234",
    variacao: "+20%",
    contexto: "8 com estoque crítico",
    positivo: true,
    icon: Package,
  },
] as const;

export function SectionCards() {
  return (
    <section
      aria-label="Resumo executivo"
      className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4"
    >
      {indicadores.map((indicador) => {
        const Icon = indicador.icon;
        const TrendIcon = indicador.positivo ? ArrowUpRight : ArrowDownRight;

        return (
          <article
            key={indicador.titulo}
            className="superficie-admin grupo-kpi group hover:shadow-elevation relative min-h-44 overflow-hidden p-5 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 sm:p-5.5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-muted-foreground text-[13px] font-medium">
                  {indicador.titulo}
                </p>
                <p className="text-foreground mt-3.5 text-[1.75rem] leading-none font-semibold tracking-[-0.035em] tabular-nums sm:text-[2rem]">
                  {indicador.valor}
                </p>
              </div>
              <span className="bg-primary-light text-primary ring-primary/10 group-hover:bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 transition-[transform,background-color] duration-200 group-hover:scale-105">
                <Icon className="size-[1.125rem]" />
              </span>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 font-semibold tabular-nums ${
                  indicador.positivo
                    ? "bg-success-light text-success-dark"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                <TrendIcon className="size-3" />
                {indicador.variacao}
              </span>
              <span className="text-muted-foreground truncate">
                {indicador.contexto}
              </span>
            </div>
          </article>
        );
      })}
    </section>
  );
}
