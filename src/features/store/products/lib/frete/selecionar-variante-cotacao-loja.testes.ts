import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import { selecionarVarianteCotacaoLoja } from "./selecionar-variante-cotacao-loja";

const variantes = [
  {
    id: "variante-1",
    name: "Variante 1",
    sku: "SKU-1",
    weightInGrams: 700,
    heightInCm: 7,
    widthInCm: 12,
    lengthInCm: 20,
  },
];

descrever("selecionarVarianteCotacaoLoja", () => {
  verificar("retorna variante quando o variantId existe", () => {
    const variante = selecionarVarianteCotacaoLoja(variantes, "variante-1");

    afirmacoes.equal(variante?.identificadorVariante, "variante-1");
    afirmacoes.equal(variante?.pesoVarianteEmGramas, 700);
  });

  verificar("retorna nulo quando variantId nao foi informado", () => {
    const variante = selecionarVarianteCotacaoLoja(variantes);

    afirmacoes.equal(variante, null);
  });

  verificar("retorna nulo quando variantId e invalido", () => {
    const variante = selecionarVarianteCotacaoLoja(
      variantes,
      "variante-invalida",
    );

    afirmacoes.equal(variante, null);
  });
});
