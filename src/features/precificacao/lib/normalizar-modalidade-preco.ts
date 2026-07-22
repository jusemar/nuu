export type ModalidadePrecoCanonica =
  | "stock"
  | "pre_sale"
  | "dropshipping"
  | "order_basis";

/**
 * Converte as chaves históricas do banco e as chaves usadas pela loja para
 * uma representação única. A função não escolhe outra modalidade como fallback.
 */
export function normalizarModalidadePrecoCanonica(
  modalidade: string | null | undefined,
): ModalidadePrecoCanonica | null {
  const tipo = modalidade?.trim();

  if (tipo === "stock") return "stock";
  if (tipo === "preSale" || tipo === "pre_sale") return "pre_sale";
  if (tipo === "dropshipping") return "dropshipping";
  if (tipo === "orderBasis" || tipo === "order_basis") return "order_basis";

  return null;
}

export function modalidadesPrecoSaoEquivalentes(
  modalidadeA: string | null | undefined,
  modalidadeB: string | null | undefined,
) {
  const tipoA = normalizarModalidadePrecoCanonica(modalidadeA);
  const tipoB = normalizarModalidadePrecoCanonica(modalidadeB);
  return tipoA !== null && tipoA === tipoB;
}

export function modalidadePrecoExigeEstoqueLocal(
  modalidade: string | null | undefined,
) {
  return normalizarModalidadePrecoCanonica(modalidade) === "stock";
}
