export const VERSAO_CONTRATO_AUDITORIA = "atendente-ia-auditoria-v1";
export const VERSAO_POLITICA_SEGURANCA = "atendente-ia-seguranca-v1";
export const VERSAO_METRICAS = "atendente-ia-metricas-v1";

export const CHAVES_PROIBIDAS_AUDITORIA = [
  "authorization", "cookie", "password", "senha", "token", "secret",
  "segredo", "credential", "credencial", "prompt", "raciocinio",
  "chain_of_thought", "email", "cpf", "telefone", "endereco",
] as const;

export const EVENTOS_METRICAS_COMPROVAVEIS = [
  "conversa_iniciada", "mensagem_recebida", "resposta_ia_concluida",
  "execucao_ia_concluida", "ferramenta_solicitada", "ferramenta_executada",
  "ferramenta_recusada", "ferramenta_falhou", "confirmacao_ferramenta_solicitada",
  "confirmacao_ferramenta_aceita", "transferencia_whatsapp_oferecida",
  "transferencia_whatsapp_recusada", "transferencia_whatsapp_link_gerado",
  "rag_fonte_encontrada", "rag_fonte_ausente", "limite_atingido",
  "evento_seguranca_bloqueado", "resultado_incerto",
] as const;
