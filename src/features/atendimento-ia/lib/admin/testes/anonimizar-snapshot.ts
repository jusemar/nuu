const SUBSTITUICOES: Array<[RegExp, string]> = [
  [/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[EMAIL_REMOVIDO]"],
  [/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[CPF_REMOVIDO]"],
  [
    /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?9?\d{4}[-\s]?\d{4}\b/g,
    "[TELEFONE_REMOVIDO]",
  ],
  [/\b\d{5}-?\d{3}\b/g, "[CEP_REMOVIDO]"],
  [
    /\b(?:pedido|order|sess[aã]o|token|pagamento|id)\s*[:#=-]?\s*[\w-]{3,}/gi,
    "[REFERENCIA_REMOVIDA]",
  ],
];

export function anonimizarSnapshot(valor: unknown): unknown {
  const limpar = (item: unknown): unknown => {
    if (typeof item === "string")
      return SUBSTITUICOES.reduce(
        (texto, [padrao, substituto]) => texto.replace(padrao, substituto),
        item,
      );
    if (Array.isArray(item)) return item.map(limpar);
    if (item && typeof item === "object")
      return Object.fromEntries(
        Object.entries(item)
          .filter(
            ([chave]) =>
              !/(nome|email|telefone|cpf|cep|endere[cç]o|pedido|id|sess[aã]o|pagamento|token|credencial)/i.test(
                chave,
              ),
          )
          .map(([chave, conteudo]) => [chave, limpar(conteudo)]),
      );
    return item;
  };
  return limpar(structuredClone(valor));
}
