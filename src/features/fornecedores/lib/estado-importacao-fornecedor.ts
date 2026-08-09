/**
 * Contadores de uma importação e o estado que se deriva deles.
 *
 * Regra pura, sem banco: a leitura fica na query, a interpretação fica aqui.
 */
export type ContadoresImportacaoFornecedor = {
  /** Linhas que a aquisição trouxe para ESTA execução. */
  total: number;
  /** Itens que viraram produto da loja nesta execução. */
  publicados: number;
  /** Itens ainda esperando decisão do gestor nesta execução. */
  pendentes: number;
  /** Itens tirados da fila de propósito, aqui ou na triagem. */
  ignorados: number;
  /** Linhas que a própria aquisição não conseguiu processar. */
  erros: number;
};

export type EstadoImportacaoFornecedor =
  | "em_andamento"
  | "parcialmente_processada"
  | "concluida"
  | "com_erros";

export const CONTADORES_IMPORTACAO_ZERADOS: ContadoresImportacaoFornecedor = {
  total: 0,
  publicados: 0,
  pendentes: 0,
  ignorados: 0,
  erros: 0,
};

/**
 * Estado da importação, derivado dos contadores.
 *
 * Nenhum enum novo: `importacoes_fornecedor.status` continua descrevendo a
 * aquisição, e o que o gestor quer ver na lista é o andamento do TRABALHO —
 * quanto sobrou para decidir. Os dois convivem sem se contradizer.
 */
export function derivarEstadoImportacaoFornecedor({
  contadores,
  statusImportacao,
}: {
  contadores: ContadoresImportacaoFornecedor;
  statusImportacao: string;
}): EstadoImportacaoFornecedor {
  if (statusImportacao === "erro" || contadores.erros > 0) return "com_erros";
  if (contadores.total === 0) return "em_andamento";
  if (contadores.pendentes > 0) {
    return contadores.publicados > 0 || contadores.ignorados > 0
      ? "parcialmente_processada"
      : "em_andamento";
  }

  return "concluida";
}

export const ROTULOS_ESTADO_IMPORTACAO_FORNECEDOR: Record<
  EstadoImportacaoFornecedor,
  string
> = {
  em_andamento: "Em andamento",
  parcialmente_processada: "Parcialmente processada",
  concluida: "Concluída",
  com_erros: "Com erros",
};
