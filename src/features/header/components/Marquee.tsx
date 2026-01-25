// Marquee.tsx
export function Marquee() {
  return (
    <div className="bg-blue-600 text-white py-2 overflow-hidden">
      <div className="animate-marquee whitespace-nowrap">
        <span className="inline-block mr-12">
          🎉 Frete grátis em compras acima de R$ 50 | 
        </span>
        <span className="inline-block mr-12">
          🎉 Cupom BEMVINDO10 para 10% de desconto | 
        </span>
        <span className="inline-block mr-12">
          🎉 Frete grátis em compras acima de R$ 50
        </span>
      </div>

      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
