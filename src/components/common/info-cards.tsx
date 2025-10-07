// src/components/common/info-cards.tsx
import Link from 'next/link';

interface InfoCard {
  title: string;
  href: string;
  icon: string;
  bgColor: string;
}

const cards: InfoCard[] = [
  {
    title: "Porque não perdermos venda",
    href: "/",
    icon: "🎯", // Agora é escudo
    bgColor: "bg-blue-100 border-blue-200"
  },
  {
    title: "Garantias", 
    href: "/",
    icon: "🛡️", // Agora é cadeado (segurança)
    bgColor: "bg-green-100 border-green-200"
  },
  {
    title: "Pagamento",
    href: "/", 
    icon: "💳",
    bgColor: "bg-purple-100 border-purple-200"
  }
];

export const InfoCards = () => {
  return (
    <div className="bg-gray-100 py-1"> 
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-10"> 
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={`
                ${card.bgColor}
                border rounded-lg p-3 
                hover:shadow-md transition-all duration-200
                w-full md:w-auto min-w-0 flex-1
                flex items-center gap-2 
                max-w-xs
              `}
            >
              <div className="text-lg">{card.icon}</div> 
              <h3 className="font-semibold text-gray-900 text-sm">
                {card.title}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};