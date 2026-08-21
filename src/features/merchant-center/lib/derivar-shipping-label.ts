import { selecionarClassificacoesLogisticasAplicaveis } from "@/features/logistica/lib/disponibilidade/selecionar-classificacoes-logisticas";

import type { VinculoClassificacaoLogisticaMerchant } from "../types/item-merchant";

/**
 * O Merchant aceita uma única shipping_label por item. Quando mais de uma
 * classificação real se aplica, representamos o conjunto de forma estável:
 * identificadores únicos, ordenados e unidos por "+".
 */
export function derivarShippingLabel({
  vinculosProduto,
  vinculosVariante,
}: {
  vinculosProduto: VinculoClassificacaoLogisticaMerchant[];
  vinculosVariante: VinculoClassificacaoLogisticaMerchant[];
}) {
  const classificacoes = selecionarClassificacoesLogisticasAplicaveis({
    vinculosProduto,
    vinculosVariante,
  });
  const label = [...new Set(classificacoes.map((item) => item.trim()))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .join("+");

  // Limite oficial do atributo. Não truncamos nem geramos hash, pois isso
  // criaria uma classificação sem correspondência explícita na logística.
  return label && label.length <= 100 ? label : undefined;
}
