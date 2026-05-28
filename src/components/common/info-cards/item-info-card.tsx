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
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#2A5F87] px-4 py-4 transition-colors duration-300 hover:bg-[#235274]"
    >
      <span className="absolute bottom-0 left-0 h-[3px] w-0 bg-[#E8981D] transition-all duration-500 group-hover:w-full" />

      <div className="mb-2.5 flex items-center gap-2">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-white/45">
          {card.numero}
        </p>
        <div className="text-[#E8981D] transition-transform duration-300 group-hover:-translate-y-0.5">
          <Icone className="h-[18px] w-[18px]" />
        </div>
        <h3 className="text-sm font-semibold text-white">{card.titulo}</h3>
      </div>
      <p className="mb-3 flex-1 text-xs leading-relaxed text-white/70">
        {card.descricao}
      </p>

      <span className="inline-flex w-fit items-center gap-1.5 text-[11px] font-semibold tracking-[0.08em] text-[#E8981D] uppercase transition-all duration-200 group-hover:gap-2.5">
        {card.link}
        <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}
