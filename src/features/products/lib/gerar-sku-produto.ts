type EntradaGerarSkuProduto = {
  nomeCategoria?: string | null;
  nomeMarca?: string | null;
};

function normalizarTrechoSku(
  valor: string | null | undefined,
  tamanho: number,
) {
  const normalizado = (valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();

  return normalizado.slice(0, tamanho);
}

/** Mantem o formato usado pelo cadastro manual: categoria-marca-numero. */
export function gerarSkuProduto({
  nomeCategoria,
  nomeMarca,
}: EntradaGerarSkuProduto) {
  const categoria = normalizarTrechoSku(nomeCategoria, 3) || "GEN";
  const marca = normalizarTrechoSku(nomeMarca, 4) || "PROD";
  const numero = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  return `${categoria}-${marca}-${numero}`;
}
