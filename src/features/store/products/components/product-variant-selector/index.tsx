"use client";

import { useMemo } from "react";

import type {
  AtributoProdutoLoja,
  VarianteProdutoLoja,
} from "../../types/product.types";

type ProductVariantSelectorProps = {
  attributes: AtributoProdutoLoja[];
  variants: VarianteProdutoLoja[];
  selectedVariant: VarianteProdutoLoja | null;
  onSelectVariant: (variant: VarianteProdutoLoja) => void;
};

const MAPA_CORES_HEX: Record<string, string> = {
  preto: "#111827",
  branca: "#FFFFFF",
  branco: "#FFFFFF",
  azul: "#2563EB",
  vermelho: "#DC2626",
  cinza: "#9CA3AF",
  verde: "#16A34A",
  amarelo: "#EAB308",
  rosa: "#EC4899",
  roxo: "#7C3AED",
  laranja: "#F97316",
  bege: "#D6D3D1",
  marrom: "#8B5E3C",
};

function normalizarValor(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function isColorAttribute(attributeName: string) {
  const normalized = normalizarValor(attributeName);
  return normalized === "cor" || normalized === "color";
}

function isSizeAttribute(attributeName: string) {
  const normalized = normalizarValor(attributeName);
  return normalized === "tamanho" || normalized === "size" || normalized === "numero";
}

function colorValueToHex(value: string) {
  const normalized = normalizarValor(value);
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim())) {
    return value.trim();
  }
  return MAPA_CORES_HEX[normalized] || "#D1D5DB";
}

function variantMatchesSelection({
  variant,
  selectedVariant,
  attributeName,
  value,
}: {
  variant: VarianteProdutoLoja;
  selectedVariant: VarianteProdutoLoja | null;
  attributeName: string;
  value: string;
}) {
  if (variant.attributes[attributeName] !== value) return false;

  if (!selectedVariant) return true;

  return Object.entries(selectedVariant.attributes).every(
    ([name, selectedValue]) =>
      name === attributeName || variant.attributes[name] === selectedValue,
  );
}

export function ProductVariantSelector({
  attributes,
  variants,
  selectedVariant,
  onSelectVariant,
}: ProductVariantSelectorProps) {
  const attributeValues = useMemo(
    () =>
      attributes
        .filter((attribute) => attribute.name.trim())
        .map((attribute) => ({
          ...attribute,
          values: Array.from(
            new Set([
              ...attribute.values,
              ...variants
                .map((variant) => variant.attributes[attribute.name])
                .filter(Boolean),
            ]),
          ),
        }))
        .filter((attribute) => attribute.values.length > 0),
    [attributes, variants],
  );

  function selectAttributeValue(attributeName: string, value: string) {
    const exactCandidate = variants.find((variant) =>
      variantMatchesSelection({
        variant,
        selectedVariant,
        attributeName,
        value,
      }),
    );
    const fallbackCandidate = variants.find(
      (variant) => variant.attributes[attributeName] === value,
    );
    const candidate = exactCandidate || fallbackCandidate;

    if (candidate) {
      onSelectVariant(candidate);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {attributeValues.map((attribute) => (
        <div key={attribute.id || attribute.name}>
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <span className="text-text-primary text-xs font-bold tracking-wider uppercase">
              {attribute.name}
            </span>
            {selectedVariant?.attributes[attribute.name] ? (
              <span className="text-text-muted text-xs font-medium">
                {selectedVariant.attributes[attribute.name]}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {attribute.values.map((value) => {
              const directVariants = variants.filter(
                (variant) => variant.attributes[attribute.name] === value,
              );
              const hasActive = directVariants.some(
                (variant) => variant.isActive,
              );
              const hasStock = directVariants.some(
                (variant) => variant.isActive && variant.stockQuantity > 0,
              );
              const selected =
                selectedVariant?.attributes[attribute.name] === value;
              const renderColor = isColorAttribute(attribute.name);
              const renderSize = isSizeAttribute(attribute.name);
              const colorHex = colorValueToHex(value);

              return (
                <button
                  key={value}
                  type="button"
                  disabled={!hasActive}
                  onClick={() => selectAttributeValue(attribute.name, value)}
                  className={
                    renderColor
                      ? `relative flex h-10 w-10 items-center justify-center rounded-full border bg-white transition-all ${
                          selected
                            ? "border-slate-900 ring-2 ring-slate-900 ring-offset-1"
                            : hasActive
                              ? "border-slate-300"
                              : "cursor-not-allowed border-slate-200 opacity-45"
                        }`
                      : renderSize
                        ? `flex h-10 min-w-12 items-center justify-center rounded-xl border bg-[#F3F4F6] px-3 text-[24px] font-semibold leading-none tracking-normal transition-all ${
                            selected
                              ? "border-slate-900 bg-white text-slate-900"
                              : hasActive
                                ? "border-[#E5E7EB] text-slate-800 hover:border-slate-400"
                                : "cursor-not-allowed border-[#E5E7EB] text-slate-400 line-through opacity-60"
                          } ${!selected && hasActive && !hasStock ? "border-dashed opacity-70" : ""}`
                        : `flex min-h-10 min-w-11 items-center justify-center rounded-lg border-[1.5px] px-3 text-[13px] font-semibold transition-all ${
                            selected
                              ? "border-primary bg-primary text-white"
                              : hasActive
                                ? "border-surface-border text-text-primary bg-white hover:border-primary-mid"
                                : "border-surface-border text-text-hint cursor-not-allowed bg-white line-through opacity-45"
                          } ${!selected && hasActive && !hasStock ? "border-dashed line-through opacity-60" : ""}`
                  }
                  title={!hasStock && hasActive ? "Sem estoque" : value}
                >
                  {renderColor ? (
                    <span
                      className={`h-8 w-8 rounded-full border ${
                        colorHex.toLowerCase() === "#ffffff"
                          ? "border-slate-300"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: colorHex }}
                    />
                  ) : (
                    value
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selectedVariant ? (
        <div className="text-text-muted flex flex-wrap items-center gap-2 text-[11px]">
          <span
            className={`rounded-full px-2 py-0.5 font-bold ${
              selectedVariant.stockQuantity > 0
                ? "bg-success-light text-success"
                : "text-danger bg-red-50"
            }`}
          >
            {selectedVariant.stockQuantity > 0
              ? `${selectedVariant.stockQuantity} em estoque`
              : "Indisponível"}
          </span>
          {selectedVariant.name ? <span>{selectedVariant.name}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
