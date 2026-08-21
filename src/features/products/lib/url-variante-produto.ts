type VarianteSelecionavelUrl = {
  id: string;
  isActive: boolean;
};

const PADRAO_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Resolve somente variantes reais, ativas e pertencentes ao produto carregado. */
export function resolverVarianteInicialUrl<T extends VarianteSelecionavelUrl>({
  tipoProduto,
  variantes,
  varianteId,
}: {
  tipoProduto: string | null | undefined;
  variantes: T[];
  varianteId: string | null | undefined;
}): T | null {
  if (
    tipoProduto !== "variable" ||
    !varianteId ||
    !PADRAO_UUID.test(varianteId)
  ) {
    return null;
  }
  return (
    variantes.find(
      (variante) => variante.id === varianteId && variante.isActive,
    ) ?? null
  );
}

/** Adiciona ou remove apenas `variant`, preservando os demais parâmetros. */
export function montarUrlProdutoComVariante({
  urlProduto,
  varianteId,
}: {
  urlProduto: string;
  varianteId?: string | null;
}) {
  const absoluta = /^https?:\/\//i.test(urlProduto);
  const url = new URL(urlProduto, "https://url-interna.invalid");
  if (varianteId) url.searchParams.set("variant", varianteId);
  else url.searchParams.delete("variant");

  return absoluta ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
}
