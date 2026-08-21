export type ProductKind = "simple" | "variable";

export type ProductVariantAttributes = Record<string, string>;

export type ProductAttributeInput = {
  id?: string;
  productId?: string;
  name: string;
  values: string[];
};

export type ProductVariantInput = {
  id?: string;
  productId?: string;
  sku: string;
  /** Identificadores explícitos do item vendável; nunca derivados do SKU. */
  gtin?: string | null;
  mpn?: string | null;
  name?: string | null;
  attributes: ProductVariantAttributes;
  priceInCents: number;
  comparePriceInCents?: number | null;
  stockQuantity: number;
  weightInGrams?: number | null;
  heightInCm?: number | null;
  widthInCm?: number | null;
  lengthInCm?: number | null;
  imageUrl?: string | null;
  classificacoesLogisticasIds?: string[];
  /**
   * Opt-in de pagamento na entrega. `null`/ausente = herda do produto,
   * `true` = aceita, `false` = bloqueia só esta variante.
   */
  aceitaPagamentoNaEntrega?: boolean | null;
  isActive: boolean;
  isDefault: boolean;
};

export type ProductVariantFormInput = Omit<
  ProductVariantInput,
  | "priceInCents"
  | "comparePriceInCents"
  | "stockQuantity"
  | "weightInGrams"
  | "heightInCm"
  | "widthInCm"
  | "lengthInCm"
> & {
  priceInCents?: number | string;
  comparePriceInCents?: number | string | null;
  stockQuantity?: number | string;
  weightInGrams?: number | string | null;
  heightInCm?: number | string | null;
  widthInCm?: number | string | null;
  lengthInCm?: number | string | null;
};

export type ProductVariantSummary = {
  total: number;
  active: number;
  missingPrice: number;
  missingDimensions: number;
  hasDefault: boolean;
};
