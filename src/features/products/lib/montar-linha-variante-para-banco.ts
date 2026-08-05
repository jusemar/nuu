import type { z } from "zod";

import type { productVariantSchema } from "../schemas/product-variants.schema";

type VarianteValidada = z.infer<typeof productVariantSchema>;

/**
 * Colunas de `product_variant` que o salvamento de variantes escreve, além de `productId`
 * e `updatedAt`. Existe como constante para o teste conseguir afirmar que nenhuma some.
 *
 * `classificacoesLogisticasIds` fica de fora de propósito: não é coluna da variante, é uma
 * tabela de vínculo gravada logo depois. `id` e `productId` também não entram — a linha é
 * sempre recriada.
 */
export const COLUNAS_PERSISTIDAS_DA_VARIANTE = [
  "sku",
  "name",
  "attributes",
  "priceInCents",
  "comparePriceInCents",
  "stockQuantity",
  "weightInGrams",
  "heightInCm",
  "widthInCm",
  "lengthInCm",
  "imageUrl",
  "aceitaPagamentoNaEntrega",
  "isActive",
  "isDefault",
] as const;

/**
 * Converte uma variante já validada na linha que vai para o banco.
 *
 * Por que isto é uma função separada, e pura?
 *
 * Salvar variantes é destrutivo: o produto tem todas as variantes apagadas e reinseridas.
 * A reinserção lista as colunas uma a uma. Quando esse mapeamento morava embutido na
 * action, um campo novo que entrasse só no Zod era aceito na validação e **descartado em
 * silêncio** na gravação — sem erro, sem log, e o gestor só descobria ao reabrir o produto
 * e ver o valor perdido.
 *
 * Extraído aqui, o mapeamento fica coberto por teste: se alguém acrescentar um campo ao
 * schema e esquecer desta função, o teste falha na hora, em vez de o dado sumir em produção.
 */
export function montarLinhaVarianteParaBanco(
  variante: VarianteValidada,
  productId: string,
  agora: Date,
) {
  return {
    productId,
    sku: variante.sku,
    name: variante.name,
    attributes: variante.attributes,
    priceInCents: variante.priceInCents,
    comparePriceInCents: variante.comparePriceInCents,
    stockQuantity: variante.stockQuantity,
    weightInGrams: variante.weightInGrams,
    heightInCm: variante.heightInCm,
    widthInCm: variante.widthInCm,
    lengthInCm: variante.lengthInCm,
    imageUrl: variante.imageUrl,
    // Precisa preservar os três estados. Um `?? false` aqui destruiria a herança,
    // transformando "não decidido" em "bloqueado" para toda variante já existente.
    aceitaPagamentoNaEntrega: variante.aceitaPagamentoNaEntrega ?? null,
    isActive: variante.isActive,
    isDefault: variante.isDefault,
    updatedAt: agora,
  };
}
