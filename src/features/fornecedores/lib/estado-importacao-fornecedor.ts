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

/** Uma linha de `group by importacao_id, status` vinda de qualquer staging. */
export type LinhaAgrupadaImportacaoFornecedor = {
  importacaoId: string | null;
  status: string;
  total: number | string;
};

/**
 * Junta as leituras de staging e de rascunhos em contadores por execução.
 *
 * Separado da query de propósito: a leitura depende do banco, a contagem não —
 * e é a contagem que precisa ser exercitada com arquivo, API, legado e
 * importação vazia sem depender de infraestrutura.
 *
 * `importacaoIds` define o universo: só quem foi pedido entra no resultado, e
 * quem foi pedido sempre aparece, mesmo zerado. É isso que impede uma linha de
 * staging legada (sem execução) ou de outra importação de vazar para um total.
 */
export function agregarContadoresImportacoesFornecedor({
  importacaoIds,
  linhasStaging,
  linhasRascunho,
}: {
  importacaoIds: string[];
  /** Staging das duas origens, já agrupado por importação e status. */
  linhasStaging: LinhaAgrupadaImportacaoFornecedor[];
  /** Rascunhos agrupados por importação e status. */
  linhasRascunho: LinhaAgrupadaImportacaoFornecedor[];
}): Map<string, ContadoresImportacaoFornecedor> {
  const contadores = new Map<string, ContadoresImportacaoFornecedor>();

  for (const id of importacaoIds) {
    contadores.set(id, { ...CONTADORES_IMPORTACAO_ZERADOS });
  }

  function acumular(
    importacaoId: string | null,
    campo: keyof ContadoresImportacaoFornecedor,
    quantidade: number,
  ) {
    if (!importacaoId) return;

    const atual = contadores.get(importacaoId);
    if (!atual) return;

    atual[campo] += quantidade;
  }

  for (const linha of linhasStaging) {
    const quantidade = Number(linha.total);

    acumular(linha.importacaoId, "total", quantidade);

    if (linha.status === "ignorado") {
      acumular(linha.importacaoId, "ignorados", quantidade);
    }

    if (linha.status === "erro") {
      acumular(linha.importacaoId, "erros", quantidade);
    }
  }

  for (const linha of linhasRascunho) {
    if (linha.status !== "publicado") continue;

    acumular(linha.importacaoId, "publicados", Number(linha.total));
  }

  // Pendente é o resto: entrou na execução e ainda não foi resolvido de
  // nenhuma forma. Calcular por diferença evita contar duas vezes o mesmo item
  // (ele existe como linha de staging E como rascunho) e cobre igualmente as
  // duas origens, que têm enums de staging diferentes.
  for (const contador of contadores.values()) {
    contador.pendentes = Math.max(
      0,
      contador.total -
        contador.publicados -
        contador.ignorados -
        contador.erros,
    );
  }

  return contadores;
}
