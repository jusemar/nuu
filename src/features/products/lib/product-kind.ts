import type {
  ProductKind,
  ProductVariantInput,
} from "../types/product-variants.types";

export function normalizeProductKind(value: unknown): ProductKind {
  return value === "variable" ? "variable" : "simple";
}

export function isVariableProduct(value: unknown): boolean {
  return normalizeProductKind(value) === "variable";
}

export function isSimpleProduct(value: unknown): boolean {
  return normalizeProductKind(value) === "simple";
}

export function summarizeProductVariants(variants: ProductVariantInput[]) {
  return {
    total: variants.length,
    active: variants.filter((variant) => variant.isActive).length,
    missingPrice: variants.filter((variant) => variant.priceInCents <= 0)
      .length,
    missingDimensions: variants.filter(
      (variant) =>
        !variant.weightInGrams ||
        !variant.heightInCm ||
        !variant.widthInCm ||
        !variant.lengthInCm,
    ).length,
    hasDefault: variants.some((variant) => variant.isDefault),
  };
}
