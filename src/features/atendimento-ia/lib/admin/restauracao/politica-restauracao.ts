const CODIGOS_RESTAURACAO_SEGUROS = new Set([
  "CHAVE_IDEMPOTENCIA_REUTILIZADA",
  "COMPORTAMENTO_HISTORICO_INCOMPATIVEL",
  "CONFLITO_VERSAO_RESTAURACAO",
  "JUSTIFICATIVA_RESTAURACAO_OBRIGATORIA",
  "RECURSO_RESTAURACAO_INCORRETO",
  "VERSAO_HISTORICA_NAO_ENCONTRADA",
]);

export function normalizarJustificativaRestauracao(valor: string) {
  const normalizada = valor.trim().replace(/\s+/g, " ");
  if (normalizada.length < 10)
    throw new Error("JUSTIFICATIVA_RESTAURACAO_OBRIGATORIA");
  return normalizada;
}

export function codigoFalhaRestauracaoSeguro(erro: unknown) {
  const mensagem = erro instanceof Error ? erro.message : "";
  return CODIGOS_RESTAURACAO_SEGUROS.has(mensagem)
    ? mensagem
    : "FALHA_RESTAURACAO_SANITIZADA";
}

export const GARANTIAS_RESTAURACAO = {
  ativaFragmentos: false,
  copiaAprovacoes: false,
  copiaLaboratorio: false,
  criaEmbeddings: false,
  estadoInicial: "rascunho",
  publicaAutomaticamente: false,
} as const;
