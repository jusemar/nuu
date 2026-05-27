import type { VarianteAtualComDimensoes } from "@/features/logistica";

export type VarianteCotacaoLojaDisponivel = {
  id: string;
  name?: string | null;
  sku?: string | null;
  weightInGrams?: number | null;
  heightInCm?: number | null;
  widthInCm?: number | null;
  lengthInCm?: number | null;
};

export function selecionarVarianteCotacaoLoja(
  variantes: VarianteCotacaoLojaDisponivel[],
  varianteId?: string | null,
): VarianteAtualComDimensoes | null {
  if (!varianteId) {
    return null;
  }

  const variante = variantes.find(
    (varianteDisponivel) => varianteDisponivel.id === varianteId,
  );

  if (!variante) {
    return null;
  }

  return {
    identificadorVariante: variante.id,
    nomeVariante: variante.name ?? null,
    codigoSkuVariante: variante.sku ?? null,
    pesoVarianteEmGramas: variante.weightInGrams ?? null,
    alturaVarianteEmCm: variante.heightInCm ?? null,
    larguraVarianteEmCm: variante.widthInCm ?? null,
    comprimentoVarianteEmCm: variante.lengthInCm ?? null,
  };
}
