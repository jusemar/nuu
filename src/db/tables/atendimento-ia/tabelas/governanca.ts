import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { userTable } from "../../autenticacao";
import {
  atendimentoIaAuditoriaCategoriaEnum,
  atendimentoIaAuditoriaResultadoEnum,
  atendimentoIaAuditoriaSeveridadeEnum,
  atendimentoIaTipoFalhaEnum,
  atendimentoIaTransferenciaStatusEnum,
} from "../enums";
import {
  atendimentoIaConversasTable,
  atendimentoIaMensagensTable,
} from "./conversas";
import {
  atendimentoIaExecucoesFerramentasTable,
  atendimentoIaExecucoesTable,
} from "./operacoes";

export const atendimentoIaTransferenciasTable = pgTable(
  "atendimento_ia_transferencias",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversaId: uuid("conversa_id")
      .notNull()
      .references(() => atendimentoIaConversasTable.id, {
        onDelete: "cascade",
      }),
    mensagemSolicitacaoId: uuid("mensagem_solicitacao_id").references(
      () => atendimentoIaMensagensTable.id,
      { onDelete: "set null" },
    ),
    usuarioId: text("usuario_id").references(() => userTable.id, {
      onDelete: "set null",
    }),
    execucaoSolicitacaoId: uuid("execucao_solicitacao_id").references(
      () => atendimentoIaExecucoesTable.id,
      { onDelete: "set null" },
    ),
    referenciaSessaoHash: text("referencia_sessao_hash"),
    canal: text("canal").notNull().default("whatsapp"),
    motivo: text("motivo").notNull(),
    resumo: text("resumo").notNull(),
    resumoEstruturado: jsonb("resumo_estruturado")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    hashResumo: text("hash_resumo"),
    referenciaDestinatarioHash: text("referencia_destinatario_hash"),
    referenciaConfirmacaoId: text("referencia_confirmacao_id"),
    dadosConfirmados: jsonb("dados_confirmados")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    pendencias: jsonb("pendencias")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    status: atendimentoIaTransferenciaStatusEnum("status")
      .notNull()
      .default("oferecido"),
    chaveIdempotencia: text("chave_idempotencia").unique(),
    expiraEm: timestamp("expira_em"),
    ofertaConfirmadaEm: timestamp("oferta_confirmada_em"),
    confirmadoEm: timestamp("confirmado_em"),
    linkGeradoEm: timestamp("link_gerado_em"),
    whatsappAbertoEm: timestamp("whatsapp_aberto_em"),
    referenciaExterna: text("referencia_externa"),
    solicitadoEm: timestamp("solicitado_em").notNull().defaultNow(),
    concluidoEm: timestamp("concluido_em"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    index("atendimento_ia_transferencias_conversa_status_idx").on(
      table.conversaId,
      table.status,
    ),
  ],
);

export const atendimentoIaAvaliacoesTable = pgTable(
  "atendimento_ia_avaliacoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversaId: uuid("conversa_id")
      .notNull()
      .references(() => atendimentoIaConversasTable.id, {
        onDelete: "cascade",
      }),
    mensagemId: uuid("mensagem_id").references(
      () => atendimentoIaMensagensTable.id,
      { onDelete: "set null" },
    ),
    origem: text("origem").notNull(),
    nota: integer("nota"),
    criterios: jsonb("criterios").$type<Record<string, unknown>>(),
    comentario: text("comentario"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    index("atendimento_ia_avaliacoes_conversa_criado_idx").on(
      table.conversaId,
      table.criadoEm,
    ),
  ],
);

export const atendimentoIaOcorrenciasTable = pgTable(
  "atendimento_ia_ocorrencias",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversaId: uuid("conversa_id").references(
      () => atendimentoIaConversasTable.id,
      { onDelete: "set null" },
    ),
    mensagemId: uuid("mensagem_id").references(
      () => atendimentoIaMensagensTable.id,
      { onDelete: "set null" },
    ),
    execucaoId: uuid("execucao_id").references(
      () => atendimentoIaExecucoesTable.id,
      { onDelete: "set null" },
    ),
    tipo: atendimentoIaTipoFalhaEnum("tipo").notNull(),
    descricaoSanitizada: text("descricao_sanitizada").notNull(),
    recuperacaoTentada: boolean("recuperacao_tentada")
      .notNull()
      .default(false),
    recuperacaoConcluida: boolean("recuperacao_concluida")
      .notNull()
      .default(false),
    resolvidaEm: timestamp("resolvida_em"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    index("atendimento_ia_ocorrencias_tipo_criado_idx").on(
      table.tipo,
      table.criadoEm,
    ),
    index("atendimento_ia_ocorrencias_conversa_idx").on(table.conversaId),
  ],
);

export const atendimentoIaAuditoriasTable = pgTable(
  "atendimento_ia_auditorias",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversaId: uuid("conversa_id").references(
      () => atendimentoIaConversasTable.id,
      { onDelete: "set null" },
    ),
    mensagemId: uuid("mensagem_id").references(
      () => atendimentoIaMensagensTable.id,
      { onDelete: "set null" },
    ),
    execucaoId: uuid("execucao_id").references(
      () => atendimentoIaExecucoesTable.id,
      { onDelete: "set null" },
    ),
    execucaoFerramentaId: uuid("execucao_ferramenta_id").references(
      () => atendimentoIaExecucoesFerramentasTable.id,
      { onDelete: "set null" },
    ),
    correlacaoId: uuid("correlacao_id").notNull().defaultRandom(),
    categoria: atendimentoIaAuditoriaCategoriaEnum("categoria").notNull().default("operacao"),
    severidade: atendimentoIaAuditoriaSeveridadeEnum("severidade").notNull().default("informativo"),
    resultado: atendimentoIaAuditoriaResultadoEnum("resultado"),
    evento: text("evento").notNull(),
    tipoAtor: text("tipo_ator").notNull(),
    identificadorAtor: text("identificador_ator"),
    usuarioId: text("usuario_id"),
    referenciaSessaoHash: text("referencia_sessao_hash"),
    acao: text("acao"),
    autorizacao: text("autorizacao"),
    estadoAnterior: text("estado_anterior"),
    estadoPosterior: text("estado_posterior"),
    codigoFalha: text("codigo_falha"),
    versoes: jsonb("versoes").$type<Record<string, string>>().notNull().default({}),
    hashIntegridade: text("hash_integridade").notNull().default(sql`md5(random()::text || clock_timestamp()::text)`),
    corrigeEventoId: uuid("corrige_evento_id"),
    justificativaCorrecao: text("justificativa_correcao"),
    metadados: jsonb("metadados").$type<Record<string, unknown>>(),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    index("atendimento_ia_auditorias_conversa_criado_idx").on(
      table.conversaId,
      table.criadoEm,
    ),
    index("atendimento_ia_auditorias_evento_idx").on(table.evento),
    index("atendimento_ia_auditorias_correlacao_idx").on(table.correlacaoId),
    index("atendimento_ia_auditorias_categoria_severidade_idx").on(table.categoria, table.severidade, table.criadoEm),
    index("atendimento_ia_auditorias_sessao_idx").on(table.referenciaSessaoHash, table.criadoEm),
  ],
);

export const atendimentoIaLimitesUsoTable = pgTable(
  "atendimento_ia_limites_uso",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    escopo: text("escopo").notNull(),
    referenciaHash: text("referencia_hash").notNull(),
    recurso: text("recurso").notNull(),
    janelaInicio: timestamp("janela_inicio").notNull(),
    janelaFim: timestamp("janela_fim").notNull(),
    quantidade: integer("quantidade").notNull().default(0),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("atendimento_ia_limites_uso_escopo_janela_unique").on(
      table.escopo,
      table.referenciaHash,
      table.recurso,
      table.janelaInicio,
    ),
    index("atendimento_ia_limites_uso_expiracao_idx").on(table.janelaFim),
    index("atendimento_ia_limites_uso_recurso_idx").on(table.recurso, table.janelaInicio),
  ],
);
