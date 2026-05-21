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
