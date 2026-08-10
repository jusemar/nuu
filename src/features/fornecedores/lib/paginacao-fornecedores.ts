/**
 * Regra de paginação das etapas do fluxo de fornecedores.
 *
 * Pura de propósito: a aritmética de página é onde nascem os erros chatos —
 * página além do fim depois de publicar um lote, `offset` negativo, limite
 * arbitrário vindo da URL. Aqui isso é testável sem banco e sem tela.
 */

/** Escolhas oferecidas ao gestor nas três etapas. Uma só lista, um só padrão. */
export const OPCOES_LIMITE_FORNECEDORES = [25, 50, 100] as const;

export const LIMITE_PADRAO_FORNECEDORES = 25;

export type PaginacaoFornecedores = {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
  offset: number;
};

/**
 * Limite vindo da URL.
 *
 * Só aceita valores da lista: `?limite=100000` não pode virar uma varredura da
 * tabela inteira só porque alguém editou o endereço.
 */
export function normalizarLimiteFornecedores(valor?: number | string | null) {
  const numero = Number(valor);

  return (OPCOES_LIMITE_FORNECEDORES as readonly number[]).includes(numero)
    ? numero
    : LIMITE_PADRAO_FORNECEDORES;
}

/** Página vindo da URL, antes de conhecer o total. */
export function normalizarPaginaFornecedores(valor?: number | string | null) {
  const numero = Math.trunc(Number(valor));

  return Number.isFinite(numero) && numero > 0 ? numero : 1;
}

/**
 * Fecha a conta já sabendo o total.
 *
 * O `clamp` é o que resolve a "página vazia": publicar os 4 itens da página 3
 * pode deixar a lista com 2 páginas, e o gestor voltaria para uma tela em
 * branco sem entender o que aconteceu. Aqui ele cai na última página real.
 */
export function calcularPaginacaoFornecedores({
  pagina,
  limite,
  total,
}: {
  pagina?: number | string | null;
  limite?: number | string | null;
  total: number;
}): PaginacaoFornecedores {
  const limiteNormalizado = normalizarLimiteFornecedores(limite);
  const totalSeguro = Math.max(0, Math.trunc(total));
  const totalPaginas = Math.max(1, Math.ceil(totalSeguro / limiteNormalizado));
  const paginaSolicitada = normalizarPaginaFornecedores(pagina);
  const paginaFinal = Math.min(paginaSolicitada, totalPaginas);

  return {
    pagina: paginaFinal,
    limite: limiteNormalizado,
    total: totalSeguro,
    totalPaginas,
    offset: (paginaFinal - 1) * limiteNormalizado,
  };
}

/**
 * `offset` para a PRIMEIRA consulta, antes de o total ser conhecido.
 *
 * A contagem e a página costumam sair juntas na mesma leitura protegida, então
 * o clamp só pode acontecer depois. Se a página pedida passar do fim, o banco
 * devolve zero linhas e `calcularPaginacaoFornecedores` corrige o rumo.
 */
export function offsetInicialFornecedores(
  pagina?: number | string | null,
  limite?: number | string | null,
) {
  return (
    (normalizarPaginaFornecedores(pagina) - 1) *
    normalizarLimiteFornecedores(limite)
  );
}
