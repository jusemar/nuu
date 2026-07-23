import type { ItemCarrinho } from "@/features/carrinho";

export function extrairModalidadesPromocionaisFreteGratis(
  itens: ItemCarrinho[],
) {
  return [
    ...new Set(
      itens
        .flatMap((item) => [item.modalidadeTipo, item.freteEscolhido?.id])
        .filter((modalidade): modalidade is string => Boolean(modalidade)),
    ),
  ];
}
