// MarqueeBanner.tsx — faixa animada de topo
// Cor: azul primário #0C447C do design system

interface MarqueeBannerProps {
  text?: string;
  speed?: number; // segundos para completar uma volta
}

export function MarqueeBanner({
  text = '🚚 Frete Grátis acima de R$ 299\u00a0\u00a0\u00a0•\u00a0🎁 10% off na primeira compra — use PRIMEIRA10\u00a0\u00a0\u00a0•\u00a0⭐ Garantia em todos os produtos\u00a0\u00a0\u00a0•\u00a0📦 Entregas para todo o Brasil\u00a0\u00a0\u00a0•\u00a0🔥 Ofertas com até 50% off',
  speed = 60,
}: MarqueeBannerProps) {
  return (
    <div
      className="w-full overflow-hidden py-2 select-none"
      style={{ background: '#0C447C' }}
      aria-label="Informações promocionais"
    >
      <div
        className="flex whitespace-nowrap"
        style={{
          animation: `marquee-scroll ${speed}s linear infinite`,
        }}
      >
        {/* Duplicado para loop contínuo sem gap */}
        {[0, 1].map((i) => (
          <span
            key={i}
            className="inline-block pr-16 text-white text-xs font-medium tracking-wide"
            aria-hidden={i === 1}
          >
            {text}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}