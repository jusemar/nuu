const PADROES_PESSOAIS = [
  /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i,
  /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/,
  /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?9?\d{4}[-\s]?\d{4}\b/,
  /\b\d{5}-?\d{3}\b/,
  /\b(?:pedido|order|sess[aã]o|token|cpf|email|telefone|endere[cç]o|pagamento)\s*[:#-]?\s*[\w-]{4,}/i,
];

export function validarDadosFicticios(valor: unknown) {
  const texto = JSON.stringify(valor)
    .replace(/\[[A-Z_]+\]/g, "")
    .replace(
      /\b(email|pedido|order|sess[aã]o|token|cpf|telefone|endere[cç]o|pagamento)\b/gi,
      "",
    );
  if (PADROES_PESSOAIS.some((padrao) => padrao.test(texto)))
    throw new Error("DADO_PESSOAL_OU_REAL_NAO_PERMITIDO");
  return true;
}
