export type {
  ProductAttributeInput,
  ProductKind,
  ProductVariantAttributes,
  ProductVariantFormInput,
  ProductVariantInput,
  ProductVariantSummary,
} from "./types/product-variants.types";

export {
  productAttributeSchema,
  productKindSchema,
  productVariantSchema,
  productVariantsPayloadSchema,
} from "./schemas/product-variants.schema";

export {
  isSimpleProduct,
  isVariableProduct,
  normalizeProductKind,
  summarizeProductVariants,
} from "./lib/product-kind";

export {
  getMainProductPriceInCents,
  getPurchasableDimensions,
} from "./lib/purchasable-item";

export {
  buildVariantName,
  buildVariantSku,
  centsToCurrencyInput,
  createMissingVariants,
  currencyInputToCents,
  generateVariantCombinations,
  getCombinationFormula,
  summarizeVariantEditor,
  variantHasCompleteDimensions,
} from "./lib/variant-editor";

export type { VariantIssue } from "./lib/variant-editor";

export {
  DESCRICOES_SITUACAO_PUBLICACAO,
  FLAG_CATALOGO,
  obterSituacaoPublicacaoProduto,
  ROTULOS_SITUACAO_PUBLICACAO,
  situacaoImpedeExibicao,
} from "./lib/situacao-publicacao-produto";
export type { SituacaoPublicacaoProduto } from "./lib/situacao-publicacao-produto";

export { BotaoDuplicarProduto } from "./components/admin/botao-duplicar-produto";
export { BotaoPublicarProduto } from "./components/admin/botao-publicar-produto";
export { SeloSituacaoPublicacao } from "./components/admin/selo-situacao-publicacao";
