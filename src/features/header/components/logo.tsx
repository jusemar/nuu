import Link from "next/link";

import { DADOS_EMPRESA } from "@/features/configuracoes-loja/constants/dados-empresa";

interface LogoProps {
  className?: string;
  /** Exibe o nome da loja ao lado do ícone. Padrão: true */
  showName?: boolean;
  /** Variante de cor: 'default' usa o azul primário, 'white' para uso em fundos escuros */
  variant?: "default" | "white";
}

export const Logo = ({
  className = "",
  showName = true,
  variant = "default",
}: LogoProps) => {
  const nameColor = variant === "white" ? "text-white" : "text-[#1F2937]";
  const subColor = variant === "white" ? "text-white/70" : "text-[#6B7280]";

  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 transition-opacity hover:opacity-85 ${className}`}
      aria-label={`${DADOS_EMPRESA.marca} — página inicial`}
    >
      {/* Ícone — azul primário do design system */}
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#0C447C] shadow-sm">
        <span className="text-sm font-bold tracking-tight text-white select-none">
          {DADOS_EMPRESA.iniciaisMarca}
        </span>
      </div>

      {/* Nome */}
      {showName && (
        <div className="hidden leading-tight sm:block">
          <span
            className={`block text-[17px] leading-none font-bold ${nameColor}`}
          >
            {DADOS_EMPRESA.marca}
          </span>
          <span className={`block text-[11px] font-normal ${subColor}`}>
            Sua loja
          </span>
        </div>
      )}
    </Link>
  );
};
