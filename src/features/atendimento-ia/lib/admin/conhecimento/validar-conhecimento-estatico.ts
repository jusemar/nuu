const REGRAS_PROIBIDAS = [
  {
    codigo: "preco_atual",
    expressao: /(?:custa|preço atual(?:\s+é)?|por apenas)\s*r?\$?\s*\d/i,
  },
  {
    codigo: "estoque_atual",
    expressao:
      /(?:(?:temos|há|restam)\s+\d+\s+(?:unidades|itens)|estoque\s+atual\s*(?::|é)\s*\d+)/i,
  },
  {
    codigo: "promocao_atual",
    expressao: /(?:promoção|desconto)\s+(?:vigente|atual|de hoje)/i,
  },
  {
    codigo: "pedido",
    expressao:
      /(?:pedido\s*(?:n[º°o.]*)?\s*\d{4,}|(?:pedido|encomenda)\s+(?:está|foi)\s+(?:enviado|entregue|cancelado))/i,
  },
  {
    codigo: "prazo_variavel",
    expressao: /(?:entrega|chega)\s+em\s+\d+\s+dias/i,
  },
  {
    codigo: "disponibilidade_variavel",
    expressao: /(?:produto|item)\s+(?:está|encontra-se)\s+disponível/i,
  },
  {
    codigo: "dado_pessoal",
    expressao:
      /(?:[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{5}-\d{3}\b)/i,
  },
  {
    codigo: "credencial",
    expressao: /(?:senha|token|api[_ -]?key|sk-[a-z0-9_-]+)/i,
  },
  {
    codigo: "instrucao_maliciosa",
    expressao: /(?:ignore|revele|mostre).{0,40}(?:instruções|prompt|sistema)/i,
  },
] as const;

export function validarConhecimentoEstatico(textos: string[]) {
  const unido = textos.join("\n");
  const violacoes = REGRAS_PROIBIDAS.filter((regra) =>
    regra.expressao.test(unido),
  ).map((regra) => regra.codigo);
  return { valido: violacoes.length === 0, violacoes };
}
