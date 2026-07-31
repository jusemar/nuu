import { LIMITE_CARACTERES_MENSAGEM_ATENDIMENTO } from "./atendimento-storage";

export { LIMITE_CARACTERES_MENSAGEM_ATENDIMENTO };

// Limite técnico do envelope JSON. O conteúdo continua limitado a 1.000
// caracteres pelo contrato funcional já usado na interface.
export const LIMITE_BYTES_REQUISICAO_ATENDIMENTO = 4 * 1024;

export const COOKIE_SESSAO_ATENDIMENTO_IA = "nuu_atendimento_ia_sessao";

export const DURACAO_IDEMPOTENCIA_ENTRADA_EM_MS = 24 * 60 * 60 * 1000;
