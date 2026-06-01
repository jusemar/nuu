import Link from "next/link";

import type { CardConfianca } from "./dados-info-cards";

interface ItemInfoCardProps {
  card: CardConfianca;
}

export function ItemInfoCard({ card }: ItemInfoCardProps) {
  const Icone = card.icone;

  return (
    <Link
      href={card.href}
      className="group border-border/80 bg-card hover:border-primary/25 hover:shadow-elevation relative flex h-full flex-col overflow-hidden rounded-xl border px-4 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5"
    >
      <span className="bg-accent-brand absolute bottom-0 left-0 h-[3px] w-0 transition-all duration-500 group-hover:w-full" />

      <div className="mb-2.5 flex items-center gap-2">
        <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.18em]">
          {card.numero}
        </p>
        <div className="text-primary transition-transform duration-300 group-hover:-translate-y-0.5">
          <Icone className="h-[18px] w-[18px]" />
        </div>
        <h3 className="text-foreground text-sm font-semibold">{card.titulo}</h3>
      </div>
      <p className="text-muted-foreground mb-3 flex-1 text-xs leading-relaxed">
        {card.descricao}
      </p>

      <span className="text-primary inline-flex w-fit items-center gap-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase transition-all duration-200 group-hover:gap-2.5">
        {card.link}
        <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}
