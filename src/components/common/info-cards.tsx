import { dadosInfoCards } from "./info-cards/dados-info-cards";
import { ItemInfoCard } from "./info-cards/item-info-card";

export const InfoCards = () => {
  return (
    <section aria-label="Diferenciais da loja">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {dadosInfoCards.map((card) => (
          <ItemInfoCard key={card.numero} card={card} />
        ))}
      </div>
    </section>
  );
};
