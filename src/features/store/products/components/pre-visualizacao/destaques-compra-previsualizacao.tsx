import { BadgePercent, Truck } from "lucide-react";

export function BannerPromocionalPrevisualizacao() {
  return (
    <aside
      aria-label="Condição promocional demonstrativa"
      className="border-accent-brand/30 bg-accent-brand-light flex items-start gap-3 rounded-2xl border px-4 py-3"
    >
      <span className="bg-accent-brand/15 text-accent-brand-dark flex size-9 shrink-0 items-center justify-center rounded-full">
        <BadgePercent aria-hidden="true" className="size-4" strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-accent-brand-dark text-sm font-semibold">
          Condição especial para compras online
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs leading-5">
          Área demonstrativa para comunicar uma campanha ativa sem competir com
          o preço.
        </p>
      </div>
    </aside>
  );
}

type ProgressoFretePrevisualizacaoProps = {
  atingido?: boolean;
  className?: string;
};

/** Somente visual: a regra real assume o controle após a cotação de frete. */
export function ProgressoFretePrevisualizacao({
  atingido = false,
  className,
}: ProgressoFretePrevisualizacaoProps) {
  const classesSemanticas = atingido
    ? {
        icone: "text-success",
        superficie: "border-success/30 bg-success-light",
        progresso: "bg-success w-full",
      }
    : {
        icone: "text-accent-brand-dark",
        superficie: "border-border bg-muted",
        progresso: "bg-accent-brand w-[18%]",
      };

  return (
    <section
      aria-label="Progresso demonstrativo de frete grátis"
      className={`rounded-2xl border p-4 ${classesSemanticas.superficie} ${className ?? ""}`}
    >
      <div className="flex items-center gap-2.5">
        <Truck
          aria-hidden="true"
          className={`size-4 shrink-0 ${classesSemanticas.icone}`}
          strokeWidth={1.8}
        />
        <div className="min-w-0">
          <p className="text-foreground text-sm font-semibold">
            {atingido ? "Frete grátis liberado" : "Frete grátis acima de R$ 299"}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {atingido
              ? "Esta compra já atende à condição de frete grátis."
              : "Faltam R$ 299,00 para ganhar frete grátis."}
          </p>
        </div>
      </div>
      <div aria-hidden="true" className="bg-border mt-3 h-1.5 overflow-hidden rounded-full">
        <div className={`h-full rounded-full ${classesSemanticas.progresso}`} />
      </div>
    </section>
  );
}
