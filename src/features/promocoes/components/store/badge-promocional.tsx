import { Sparkles, Zap } from "lucide-react";

export type TipoBadgePromocionalVisual = "promocao" | "relampago";

type BadgePromocionalProps = {
  tipo?: TipoBadgePromocionalVisual | null;
  percentualOff?: number | null;
  compacto?: boolean;
  className?: string;
};

function obterTextoBadgePromocional({
  tipo,
  percentualOff,
}: {
  tipo?: TipoBadgePromocionalVisual | null;
  percentualOff?: number | null;
}) {
  if (percentualOff && percentualOff > 0) {
    return `-${percentualOff}% OFF`;
  }

  return tipo === "relampago" ? "Relâmpago" : "Promoção";
}

export function BadgePromocional({
  tipo = "promocao",
  percentualOff,
  compacto = true,
  className = "",
}: BadgePromocionalProps) {
  const relampago = tipo === "relampago";
  const Icone = relampago ? Zap : Sparkles;
  const classesBase = compacto
    ? "rounded-md px-2 py-0.5 text-[10px]"
    : "rounded-md px-3 py-1.5 text-xs";
  const classesCor = relampago
    ? "bg-red-100 text-red-800"
    : "bg-accent-brand text-white";

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold tracking-wide uppercase ${classesBase} ${classesCor} ${className}`}
    >
      <Icone className={compacto ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {obterTextoBadgePromocional({ tipo, percentualOff })}
    </span>
  );
}
