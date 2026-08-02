import { pgEnum } from "drizzle-orm/pg-core";

export const atendimentoIaCanalEnum = pgEnum("atendimento_ia_canal", [
  "site",
]);

export const atendimentoIaConversaStatusEnum = pgEnum(
  "atendimento_ia_conversa_status",
  ["ativa", "aguardando_atendimento_humano", "encerrada"],
);

export const atendimentoIaAutorMensagemEnum = pgEnum(
  "atendimento_ia_autor_mensagem",
  ["cliente", "assistente_ia", "atendente_humano", "sistema"],
);

export const atendimentoIaMensagemStatusEnum = pgEnum(
  "atendimento_ia_mensagem_status",
  [
    "recebida",
    "validando",
    "processando",
    "aguardando_ferramenta",
    "executando_ferramenta",
    "gerando_resposta",
    "concluida",
    "falhou",
    "aguardando_atendimento_humano",
  ],
);

export const atendimentoIaOrigemInformacaoEnum = pgEnum(
  "atendimento_ia_origem_informacao",
  [
    "informada_cliente",
    "confirmada_sistema",
    "inferida_ia",
    "acao_solicitada",
    "acao_concluida",
    "informacao_vencida",
    "informacao_possivelmente_desatualizada",
  ],
);

export const atendimentoIaExecucaoStatusEnum = pgEnum(
  "atendimento_ia_execucao_status",
  ["processando", "concluida", "falhou", "limite_excedido"],
);

export const atendimentoIaFerramentaClassificacaoEnum = pgEnum(
  "atendimento_ia_ferramenta_classificacao",
  [
    "consulta_publica",
    "consulta_protegida",
    "acao_reversivel",
    "acao_sensivel",
    "encaminhamento_humano",
  ],
);

export const atendimentoIaTransferenciaStatusEnum = pgEnum(
  "atendimento_ia_transferencia_status",
  [
    "solicitada",
    "aguardando_atendimento",
    "em_atendimento",
    "concluida",
    "oferecido",
    "recusado",
    "resumo_preparado",
    "aguardando_confirmacao",
    "confirmado",
    "cancelado",
    "link_gerado",
    "whatsapp_aberto",
    "falha_ao_gerar_link",
    "expirado",
  ],
);

export const atendimentoIaTipoFalhaEnum = pgEnum(
  "atendimento_ia_tipo_falha",
  [
    "entrada_invalida",
    "modelo_indisponivel",
    "ferramenta_indisponivel",
    "integracao_indisponivel",
    "falta_autorizacao",
    "limite_excedido",
    "ausencia_dado_oficial",
    "conflito_fontes",
    "erro_interno",
  ],
);

export const atendimentoIaDocumentoEstadoEnum = pgEnum(
  "atendimento_ia_documento_estado",
  ["rascunho", "em_revisao", "publicado", "desativado"],
);

export const atendimentoIaIndexacaoStatusEnum = pgEnum(
  "atendimento_ia_indexacao_status",
  ["pendente", "processando", "concluida", "falhou"],
);

export const atendimentoIaBuscaRagStatusEnum = pgEnum(
  "atendimento_ia_busca_rag_status",
  ["fonte_encontrada", "fonte_ausente", "conflito"],
);

export const atendimentoIaConfirmacaoStatusEnum = pgEnum(
  "atendimento_ia_confirmacao_status",
  ["pendente", "confirmada", "consumida", "cancelada", "expirada", "invalidada"],
);

export const atendimentoIaOperacaoProtegidaStatusEnum = pgEnum(
  "atendimento_ia_operacao_protegida_status",
  ["processando", "concluida", "falha_sem_execucao", "resultado_incerto"],
);

export const atendimentoIaAuditoriaCategoriaEnum = pgEnum(
  "atendimento_ia_auditoria_categoria",
  ["operacao", "seguranca", "privacidade", "integracao", "limite"],
);

export const atendimentoIaAuditoriaSeveridadeEnum = pgEnum(
  "atendimento_ia_auditoria_severidade",
  ["informativo", "atencao", "risco_relevante", "critico"],
);

export const atendimentoIaAuditoriaResultadoEnum = pgEnum(
  "atendimento_ia_auditoria_resultado",
  ["sucesso_comprovado", "recusa", "falha", "cancelamento", "expiracao", "parcial", "incerto", "indisponibilidade"],
);
