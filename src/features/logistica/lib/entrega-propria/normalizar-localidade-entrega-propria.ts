/**
 * Gera a chave canônica usada para comparar cidade e bairro na Entrega Própria.
 * Mantém a regra em um único ponto para cadastro, resolução e migração de dados.
 */
export function normalizarLocalidadeEntregaPropria(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
}
