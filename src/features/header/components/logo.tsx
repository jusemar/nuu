import Link from 'next/link';

interface LogoProps {
  className?: string;
  /** Exibe o nome da loja ao lado do ícone. Padrão: true */
  showName?: boolean;
  /** Variante de cor: 'default' usa o azul primário, 'white' para uso em fundos escuros */
  variant?: 'default' | 'white';
}

export const Logo = ({
  className = '',
  showName = true,
  variant = 'default',
}: LogoProps) => {
  const nameColor = variant === 'white' ? 'text-white' : 'text-[#1F2937]';
  const subColor  = variant === 'white' ? 'text-white/70' : 'text-[#6B7280]';

  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 hover:opacity-85 transition-opacity ${className}`}
      aria-label="Do Rocha — página inicial"
    >
      {/* Ícone — azul primário do design system */}
      <div className="w-9 h-9 bg-[#0C447C] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
        <span className="text-white font-bold text-sm tracking-tight select-none">DR</span>
      </div>

      {/* Nome */}
      {showName && (
        <div className="hidden sm:block leading-tight">
          <span className={`block font-bold text-[17px] leading-none ${nameColor}`}>
            Do Rocha
          </span>
          <span className={`block text-[11px] font-normal ${subColor}`}>
            Sua loja
          </span>
        </div>
      )}
    </Link>
  );
};