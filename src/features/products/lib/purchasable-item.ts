import type { ProductVariantInput } from "../types/product-variants.types";
import { isVariableProduct } from "./product-kind";

type SimpleProductPurchasable = {
  productKind?: string | null;
  sku?: string | null;
  costPrice?: number | null;
  salePrice?: number | null;
  promoPrice?: number | null;
  weight?: number | null;
  height?: number | null;
  width?: number | null;
  length?: number | null;
};

export function getMainProductPriceInCents(product: SimpleProductPurchasable) {
  return product.promoPrice ?? product.salePrice ?? product.costPrice ?? null;
}

export function getPurchasableDimensions({
  product,
  variant,
}: {
  product: SimpleProductPurchasable;
  variant?: ProductVariantInput | null;
}) {
  if (isVariableProduct(product.productKind) && variant) {
    return {
      weightInGrams: variant.weightInGrams ?? null,
      heightInCm: variant.heightInCm ?? null,
      widthInCm: variant.widthInCm ?? null,
      lengthInCm: variant.lengthInCm ?? null,
    };
  }

  return {
    weightInGrams: product.weight ?? null,
    heightInCm: product.height ?? null,
    widthInCm: product.width ?? null,
    lengthInCm: product.length ?? null,
  };
}
