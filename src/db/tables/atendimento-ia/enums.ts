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
  ["solicitada", "aguardando_atendimento", "em_atendimento", "concluida"],
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
