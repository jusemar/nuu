function normalizarPrecoDecimal(valor: string | null) {
  if (!valor) return null;

  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? numero : null;
}

type LinhaComPrecos = {
  precoCalculado: string | null;
  precoOriginal: string | null;
  precoFornecedor: string | null;
};

/**
 * Resolve o preço final de uma linha de staging: prioriza o preço já
 * calculado pelas regras de ajuste da importação, depois o original
 * informado, e só então o bruto recebido do fornecedor.
 */
export function resolverPrecoFinalStagingFornecedor(linha: LinhaComPrecos) {
  return (
    normalizarPrecoDecimal(linha.precoCalculado) ??
    normalizarPrecoDecimal(linha.precoOriginal) ??
    normalizarPrecoDecimal(linha.precoFornecedor)
  );
}
