const PROIBIDOS = [
  /inventar (?:preço|estoque|informação)/i,
  /responder (?:qualquer|conhecimento geral)/i,
  /não (?:consultar|usar) dados reais/i,
  /alterar (?:whatsapp|número)/i,
  /ações administrativas permitidas/i,
  /remover (?:segurança|privacidade)/i,
  /pressionar o cliente/i,
  /manipular (?:urgência|escassez)/i,
];
export const RESUMO_NUCLEO_PROTEGIDO = [
  "Segurança e privacidade obrigatórias",
  "Dados dinâmicos somente por fontes reais",
  "Escopo restrito à loja",
  "Ferramentas protegidas e handoff preservados",
  "WhatsApp oficial e operações administrativas não editáveis",
  "Structured Outputs e limites técnicos preservados",
] as const;
export function validarNucleoProtegido(configuracao: unknown) {
  const texto = JSON.stringify(configuracao);
  if (PROIBIDOS.some((item) => item.test(texto)))
    throw new Error("NUCLEO_PROTEGIDO_VIOLADO");
  return true;
}
