import type { ItemCarrinho } from "@/features/carrinho";

export function extrairModalidadesPromocionaisFreteGratis(
  itens: ItemCarrinho[],
) {
  return [
    ...new Set(
      itens
        .map((item) => item.modalidadeTipo)
        .filter((modalidade): modalidade is string => Boolean(modalidade)),
    ),
  ];
}

export function extrairFormasEntregaPromocionaisFreteGratis(
  itens: ItemCarrinho[],
) {
  return [
    ...new Set(
      itens
        .map((item) => item.freteEscolhido?.id)
        .map((formaEntrega) => {
          if (formaEntrega === "frenet") return "frete-externo";
          return formaEntrega;
        })
        .filter(
          (
            formaEntrega,
          ): formaEntrega is "entrega-propria" | "frete-externo" | "retirada" =>
            Boolean(formaEntrega),
        ),
    ),
  ];
}
