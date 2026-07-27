// MarqueeBanner.tsx — faixa animada de topo
interface MarqueeBannerProps {
  text?: string;
  speed?: number; // segundos para completar uma volta
}

export function MarqueeBanner({
  text = "🚚 Frete Grátis acima de R$ 299\u00a0\u00a0\u00a0•\u00a0🎁 10% off na primeira compra — use PRIMEIRA10\u00a0\u00a0\u00a0•\u00a0⭐ Garantia em todos os produtos\u00a0\u00a0\u00a0•\u00a0📦 Entregas para todo o Brasil\u00a0\u00a0\u00a0•\u00a0🔥 Ofertas com até 50% off",
  speed = 60,
}: MarqueeBannerProps) {
  return (
    <div
      className="bg-primary text-primary-foreground w-full overflow-hidden py-2 select-none"
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
            className="inline-block pr-16 text-xs font-medium tracking-wide"
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
