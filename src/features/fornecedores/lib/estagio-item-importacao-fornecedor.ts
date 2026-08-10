/**
 * Estágio operacional de UM item dentro de UMA importação.
 *
 * Não confundir com o VÍNCULO PERMANENTE
 * (`fornecedorId + codigoFornecedor → produtoId`), que continua existindo
 * depois de publicado e vale para todas as importações seguintes.
 *
 * Foi exatamente essa confusão que apareceu na tela: um produto já publicado
 * seguia exibido como "Vinculado", porque o único sinal consultado era
 * `produto_localizado_id` — que aponta para o produto real e nunca deixa de
 * existir. O estágio do item neste ciclo é outra coisa, e é o que o gestor
 * precisa ver.
 */
export type EstagioItemImportacaoFornecedor =
  /** Concluiu a Publicação nesta importação. Terminal. */
  | "publicado"
  /** Decisão final de não processar neste ciclo. Terminal. */
  | "ignorado"
  /** A aquisição não conseguiu processar a linha. */
  | "erro"
  /** O gestor marcou explicitamente para criar produto novo. */
  | "novo"
  /** Associado a um produto real, mas o ciclo ainda não terminou. */
  | "vinculado"
  /** Ainda precisa de decisão na Vinculação. */
  | "pendente";

export type EntradaEstagioItemImportacaoFornecedor = {
  /** Status da linha de staging desta importação. */
  statusStaging: string;
  /**
   * O gestor marcou este item para virar produto novo — sinalizado pelo
   * RASCUNHO DE CRIAÇÃO desta importação.
   *
   * Não confundir com `criterio_localizacao = 'novo_produto_fornecedor'`, que a
   * análise grava em massa para toda linha sem vínculo. Aquilo descreve por que
   * o produto não foi encontrado, não uma decisão de quem opera.
   */
  marcadoComoNovo: boolean;
  /** Produto real encontrado — o vínculo, que é permanente. */
  possuiProdutoVinculado: boolean;
  /** O rascunho DESTA importação chegou a `publicado`. */
  publicadoNestaImportacao: boolean;
};

/**
 * A ordem das checagens é a regra de negócio.
 *
 * `publicado` vem primeiro porque é terminal e vence qualquer outro sinal —
 * inclusive o vínculo. Depois vêm as decisões finais do ciclo (ignorado, erro)
 * e só então os estágios de trabalho.
 */
export function derivarEstagioItemImportacaoFornecedor(
  entrada: EntradaEstagioItemImportacaoFornecedor,
): EstagioItemImportacaoFornecedor {
  if (entrada.publicadoNestaImportacao) return "publicado";
  if (entrada.statusStaging === "ignorado") return "ignorado";
  if (entrada.statusStaging === "erro" || entrada.statusStaging === "rejeitado") {
    return "erro";
  }
  if (entrada.marcadoComoNovo) return "novo";
  if (entrada.possuiProdutoVinculado) return "vinculado";

  return "pendente";
}

/** Estágios que já não pedem nada do gestor nesta importação. */
export function estagioEhTerminalFornecedor(
  estagio: EstagioItemImportacaoFornecedor,
): boolean {
  return estagio === "publicado" || estagio === "ignorado";
}
