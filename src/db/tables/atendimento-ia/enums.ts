import { pgEnum } from "drizzle-orm/pg-core";

export const atendimentoIaCanalEnum = pgEnum("atendimento_ia_canal", ["site"]);

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

export const atendimentoIaTipoFalhaEnum = pgEnum("atendimento_ia_tipo_falha", [
  "entrada_invalida",
  "modelo_indisponivel",
  "ferramenta_indisponivel",
  "integracao_indisponivel",
  "falta_autorizacao",
  "limite_excedido",
  "ausencia_dado_oficial",
  "conflito_fontes",
  "erro_interno",
]);

export const atendimentoIaDocumentoEstadoEnum = pgEnum(
  "atendimento_ia_documento_estado",
  ["rascunho", "em_revisao", "publicado", "desativado"],
);

export const atendimentoIaTipoConhecimentoEnum = pgEnum(
  "atendimento_ia_tipo_conhecimento",
  ["institucional", "pergunta_resposta"],
);

export const atendimentoIaConhecimentoSituacaoEnum = pgEnum(
  "atendimento_ia_conhecimento_situacao",
  ["ativa", "arquivada"],
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
  [
    "pendente",
    "confirmada",
    "consumida",
    "cancelada",
    "expirada",
    "invalidada",
  ],
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
  [
    "sucesso_comprovado",
    "recusa",
    "falha",
    "cancelamento",
    "expiracao",
    "parcial",
    "incerto",
    "indisponibilidade",
  ],
);

/** Papéis ficam no banco para impedir valores arbitrários nas atribuições. */
export const atendimentoIaPapelAdminEnum = pgEnum(
  "atendimento_ia_papel_admin",
  ["gestor_principal", "revisor", "visualizador"],
);

export const atendimentoIaAvaliacaoStatusEnum = pgEnum(
  "atendimento_ia_avaliacao_status",
  ["registrada", "substituida", "cancelada"],
);

export const atendimentoIaResultadoAvaliacaoEnum = pgEnum(
  "atendimento_ia_resultado_avaliacao",
  ["aprovado", "precisa_melhorar", "reprovado"],
);

export const atendimentoIaClassificacaoProblemaEnum = pgEnum(
  "atendimento_ia_classificacao_problema",
  [
    "resposta_incorreta",
    "resposta_sem_fonte",
    "fonte_desatualizada",
    "conflito_fontes",
    "lacuna_conhecimento",
    "ferramenta_ausente",
    "ferramenta_falhou",
    "consulta_real_omitida",
    "fora_escopo_incorreto",
    "transferencia_prematura",
    "transferencia_ausente",
    "problema_tom",
    "problema_clareza",
    "risco_seguranca",
    "exposicao_dados",
    "outro",
  ],
);

export const atendimentoIaRevisaoStatusEnum = pgEnum(
  "atendimento_ia_revisao_status",
  [
    "pendente",
    "em_analise",
    "aprovada",
    "reprovada",
    "cancelada",
    "substituida",
  ],
);

export const atendimentoIaPropostaStatusEnum = pgEnum(
  "atendimento_ia_proposta_status",
  [
    "aberta",
    "em_triagem",
    "aceita",
    "em_implementacao",
    "aguardando_testes",
    "concluida",
    "rejeitada",
    "cancelada",
  ],
);

export const atendimentoIaEvidenciaTipoEnum = pgEnum(
  "atendimento_ia_evidencia_tipo",
  [
    "conversa",
    "mensagem",
    "execucao",
    "avaliacao",
    "ocorrencia",
    "transferencia",
    "resultado_rag",
  ],
);

export const atendimentoIaCasoTesteEstadoEnum = pgEnum(
  "atendimento_ia_caso_teste_estado",
  ["rascunho", "em_revisao", "aprovado", "desativado"],
);

export const atendimentoIaCasoTesteCriticidadeEnum = pgEnum(
  "atendimento_ia_caso_teste_criticidade",
  ["baixa", "media", "alta", "critica"],
);

export const atendimentoIaCasoTesteCategoriaEnum = pgEnum(
  "atendimento_ia_caso_teste_categoria",
  [
    "conhecimento",
    "pergunta_resposta",
    "comportamento",
    "ferramenta",
    "integracao",
    "transferencia_humana",
    "seguranca",
    "privacidade",
    "fora_escopo",
    "experiencia_usuario",
  ],
);

export const atendimentoIaCasoTesteDadosOrigemEnum = pgEnum(
  "atendimento_ia_caso_teste_dados_origem",
  ["ficticio", "snapshot_anonimizado"],
);

export const atendimentoIaLaboratorioTipoComparacaoEnum = pgEnum(
  "atendimento_ia_laboratorio_tipo_comparacao",
  ["conhecimento", "comportamento", "combinado", "lote"],
);
export const atendimentoIaLaboratorioModoExecucaoEnum = pgEnum(
  "atendimento_ia_laboratorio_modo_execucao",
  ["sincrono", "assincrono"],
);
export const atendimentoIaLaboratorioStatusEnum = pgEnum(
  "atendimento_ia_laboratorio_status",
  ["pendente", "processando", "concluida", "falhou", "cancelada", "bloqueada"],
);
export const atendimentoIaLaboratorioResultadoEnum = pgEnum(
  "atendimento_ia_laboratorio_resultado",
  ["aprovado", "reprovado", "inconclusivo", "bloqueado"],
);
