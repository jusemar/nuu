/**
 * Converte os dois formatos decimais aceitos nas respostas históricas da
 * Laquila para a representação canônica usada pelo staging (`1234.56`).
 *
 * A função pertence ao adaptador Laquila: não interfere na interpretação de
 * planilhas ou de dados enviados por outros fornecedores.
 */
export function normalizarDecimalLaquila(valor: string | null) {
  if (!valor) return null;

  const texto = valor.trim();
  if (!texto) return null;

  const formatoBrasileiro = /^-?(?:\d{1,3}(?:\.\d{3})+|\d+),\d+$/u;
  const formatoApi = /^-?\d+(?:\.\d+)?$/u;

  const normalizado = formatoBrasileiro.test(texto)
    ? texto.replace(/\./g, "").replace(",", ".")
    : formatoApi.test(texto)
      ? texto
      : null;

  if (normalizado === null || !Number.isFinite(Number(normalizado))) {
    return null;
  }

  return normalizado;
}

const PRECO_MAXIMO_PLAUSIVEL_LAQUILA = 100_000;

export type AnomaliaPrecoLaquila = "negativo" | "acima_do_limite_plausivel";

/**
 * Heurística exclusivamente observacional. Ela ajuda a revelar deslocamentos
 * decimais sem transformar o valor nem impedir que o catálogo entre no staging.
 */
export function identificarAnomaliaPrecoLaquila(
  valorNormalizado: string | null,
): AnomaliaPrecoLaquila | null {
  if (valorNormalizado === null) return null;

  const numero = Number(valorNormalizado);
  if (!Number.isFinite(numero)) return null;
  if (numero < 0) return "negativo";
  if (numero > PRECO_MAXIMO_PLAUSIVEL_LAQUILA) {
    return "acima_do_limite_plausivel";
  }

  return null;
}
