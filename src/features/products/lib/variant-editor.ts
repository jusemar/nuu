import type {
  ProductAttributeInput,
  ProductVariantFormInput,
} from "../types/product-variants.types";

export type VariantIssue = {
  type:
    | "missing-sku"
    | "missing-price"
    | "missing-stock"
    | "missing-weight"
    | "missing-dimensions"
    | "missing-default"
    | "multiple-defaults";
  label: string;
  count: number;
};

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeAttributesKey(attributes: Record<string, string>) {
  return JSON.stringify(
    Object.entries(attributes)
      .filter(([key, value]) => key.trim() && value.trim())
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

export function centsToCurrencyInput(
  value: ProductVariantFormInput["priceInCents"],
) {
  const cents = toNumber(value) ?? 0;
  if (cents <= 0) return "";
  return (cents / 100).toFixed(2);
}

export function currencyInputToCents(value: string) {
  const parsed = Number(value.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export function buildVariantName(attributes: Record<string, string>) {
  return Object.values(attributes).filter(Boolean).join(" / ");
}

export function buildVariantSku(
  baseSku: string,
  attributes: Record<string, string>,
) {
  const suffix = Object.values(attributes)
    .filter(Boolean)
    .map((value) =>
      value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 4)
        .toUpperCase(),
    )
    .join("-");

  return [baseSku || "SKU", suffix].filter(Boolean).join("-");
}

export function generateVariantCombinations(
  attributes: ProductAttributeInput[],
) {
  const validAttributes = attributes
    .map((attribute) => ({
      ...attribute,
      name: attribute.name.trim(),
      values: Array.from(
        new Set(attribute.values.map((value) => value.trim()).filter(Boolean)),
      ),
    }))
    .filter((attribute) => attribute.name && attribute.values.length > 0);

  if (validAttributes.length === 0) return [];

  return validAttributes.reduce<Record<string, string>[]>(
    (combinations, attribute) =>
      combinations.flatMap((combination) =>
        attribute.values.map((value) => ({
          ...combination,
          [attribute.name]: value,
        })),
      ),
    [{}],
  );
}

export function getCombinationFormula(attributes: ProductAttributeInput[]) {
  const parts = attributes
    .filter((attribute) => attribute.name.trim())
    .map((attribute) => ({
      name: attribute.name.trim(),
      count: attribute.values.filter((value) => value.trim()).length,
    }));

  const total = parts.reduce(
    (result, part) => result * Math.max(part.count, 1),
    parts.length > 0 ? 1 : 0,
  );

  return {
    parts,
    total,
    label:
      parts.length > 0
        ? `${parts
            .map((part) => `${part.count} ${part.name.toLowerCase()}`)
            .join(" x ")} = ${total} variantes`
        : "Adicione atributos para calcular combinações",
  };
}

export function createMissingVariants({
  baseSku,
  attributes,
  variants,
}: {
  baseSku: string;
  attributes: ProductAttributeInput[];
  variants: ProductVariantFormInput[];
}) {
  const combinations = generateVariantCombinations(attributes);
  const existingKeys = new Set(
    variants.map((variant) => normalizeAttributesKey(variant.attributes || {})),
  );

  return combinations
    .filter(
      (combination) => !existingKeys.has(normalizeAttributesKey(combination)),
    )
    .map((combination, index) => ({
      id: `variant-${Date.now()}-${index}`,
      sku: buildVariantSku(baseSku, combination),
      name: buildVariantName(combination),
      attributes: combination,
      priceInCents: 0,
      comparePriceInCents: null,
      stockQuantity: 0,
      weightInGrams: null,
      heightInCm: null,
      widthInCm: null,
      lengthInCm: null,
      imageUrl: null,
      isActive: true,
      isDefault: variants.length === 0 && index === 0,
    }));
}

export function variantHasCompleteDimensions(variant: ProductVariantFormInput) {
  return Boolean(
    toNumber(variant.weightInGrams) &&
      toNumber(variant.heightInCm) &&
      toNumber(variant.widthInCm) &&
      toNumber(variant.lengthInCm),
  );
}

export function summarizeVariantEditor(
  variants: ProductVariantFormInput[] = [],
) {
  const activeVariants = variants.filter((variant) => variant.isActive);
  const prices = variants
    .map((variant) => toNumber(variant.priceInCents) ?? 0)
    .filter((price) => price > 0);
  const defaultVariants = variants.filter((variant) => variant.isDefault);
  const withWeight = variants.filter((variant) =>
    Boolean(toNumber(variant.weightInGrams)),
  ).length;
  const withDimensions = variants.filter(variantHasCompleteDimensions).length;
  const missingPrice = activeVariants.filter(
    (variant) => !toNumber(variant.priceInCents),
  ).length;
  const missingStock = activeVariants.filter(
    (variant) =>
      variant.stockQuantity === null ||
      variant.stockQuantity === undefined ||
      variant.stockQuantity === "",
  ).length;
  const missingWeight = activeVariants.filter(
    (variant) => !toNumber(variant.weightInGrams),
  ).length;
  const missingDimensions = activeVariants.filter(
    (variant) => !variantHasCompleteDimensions(variant),
  ).length;

  const issues = [
    {
      type: "missing-sku",
      label: "variante ativa sem SKU",
      count: activeVariants.filter((variant) => !variant.sku.trim()).length,
    },
    {
      type: "missing-price",
      label: "variante ativa sem preço",
      count: missingPrice,
    },
    {
      type: "missing-stock",
      label: "variante ativa sem estoque definido",
      count: missingStock,
    },
    {
      type: "missing-weight",
      label: "variante ativa sem peso",
      count: missingWeight,
    },
    {
      type: "missing-dimensions",
      label: "variante ativa sem dimensões completas",
      count: missingDimensions,
    },
    {
      type: "missing-default",
      label: "nenhuma variante padrão",
      count: defaultVariants.length === 0 && variants.length > 0 ? 1 : 0,
    },
    {
      type: "multiple-defaults",
      label: "mais de uma variante padrão",
      count: defaultVariants.length > 1 ? defaultVariants.length : 0,
    },
  ] satisfies VariantIssue[];

  return {
    total: variants.length,
    active: activeVariants.length,
    inactive: variants.length - activeVariants.length,
    missingPrice,
    missingStock,
    missingWeight,
    missingDimensions,
    withWeight,
    withDimensions,
    minPriceInCents: prices.length ? Math.min(...prices) : 0,
    maxPriceInCents: prices.length ? Math.max(...prices) : 0,
    defaultCount: defaultVariants.length,
    defaultVariant: defaultVariants[0] ?? null,
    completionPercent: variants.length
      ? Math.round((withDimensions / variants.length) * 100)
      : 0,
    issues: issues.filter((issue) => issue.count > 0),
  };
}
