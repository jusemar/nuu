export type ItemOrdemFaq = { id: string; orderIndex: number };

/** Mantém índices contíguos depois de criação, exclusão ou drag-and-drop. */
export function normalizarOrdemFaqs<T extends { id: string }>(itens: T[]) {
  return itens.map((item, orderIndex) => ({ ...item, orderIndex }));
}

/** Garante que nenhum ID de outra categoria entre no update de ordenação. */
export function validarEscopoOrdemFaqs(
  idsExistentes: string[],
  ordem: ItemOrdemFaq[],
) {
  const idsRecebidos = ordem.map((item) => item.id);
  if (
    idsExistentes.length !== idsRecebidos.length ||
    idsExistentes.some((id) => !idsRecebidos.includes(id))
  )
    throw new Error(
      "A ordem deve conter somente todas as FAQs desta categoria.",
    );
  return ordem;
}
