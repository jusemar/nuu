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
  atendimentoIaAutorMensagemEnum,
  atendimentoIaCanalEnum,
  atendimentoIaConversaStatusEnum,
  atendimentoIaMensagemStatusEnum,
  atendimentoIaOrigemInformacaoEnum,
} from "../enums";

export const atendimentoIaConversasTable = pgTable(
  "atendimento_ia_conversas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: text("usuario_id").references(() => userTable.id, {
      onDelete: "set null",
    }),
    identificadorSessao: text("identificador_sessao").notNull(),
    canal: atendimentoIaCanalEnum("canal").notNull().default("site"),
    status: atendimentoIaConversaStatusEnum("status")
      .notNull()
      .default("ativa"),
    ultimaAtividadeEm: timestamp("ultima_atividade_em")
      .notNull()
      .defaultNow(),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    index("atendimento_ia_conversas_usuario_idx").on(table.usuarioId),
    index("atendimento_ia_conversas_sessao_idx").on(
      table.identificadorSessao,
    ),
    index("atendimento_ia_conversas_status_atividade_idx").on(
      table.status,
      table.ultimaAtividadeEm,
    ),
  ],
);

export const atendimentoIaMensagensTable = pgTable(
  "atendimento_ia_mensagens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversaId: uuid("conversa_id")
      .notNull()
      .references(() => atendimentoIaConversasTable.id, {
        onDelete: "cascade",
      }),
    identificadorCanal: text("identificador_canal"),
    chaveIdempotencia: text("chave_idempotencia").notNull(),
    autor: atendimentoIaAutorMensagemEnum("autor").notNull(),
    conteudo: text("conteudo").notNull(),
    status: atendimentoIaMensagemStatusEnum("status")
      .notNull()
      .default("recebida"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("atendimento_ia_mensagens_idempotencia_unique").on(
      table.chaveIdempotencia,
    ),
    index("atendimento_ia_mensagens_conversa_criado_idx").on(
      table.conversaId,
      table.criadoEm,
    ),
    index("atendimento_ia_mensagens_status_idx").on(table.status),
  ],
);

export const atendimentoIaEstadosTable = pgTable(
  "atendimento_ia_estados",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversaId: uuid("conversa_id")
      .notNull()
      .references(() => atendimentoIaConversasTable.id, {
        onDelete: "cascade",
      }),
    intencaoAtual: text("intencao_atual"),
    etapaAtual: text("etapa_atual"),
    estadoEstruturado: jsonb("estado_estruturado")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    versao: integer("versao").notNull().default(1),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("atendimento_ia_estados_conversa_unique").on(table.conversaId),
  ],
);

export const atendimentoIaResumosTable = pgTable(
  "atendimento_ia_resumos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversaId: uuid("conversa_id")
      .notNull()
      .references(() => atendimentoIaConversasTable.id, {
        onDelete: "cascade",
      }),
    ateMensagemId: uuid("ate_mensagem_id").references(
      () => atendimentoIaMensagensTable.id,
      { onDelete: "set null" },
    ),
    conteudo: text("conteudo").notNull(),
    resumoEstruturado: jsonb("resumo_estruturado")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    index("atendimento_ia_resumos_conversa_criado_idx").on(
      table.conversaId,
      table.criadoEm,
    ),
  ],
);

export const atendimentoIaMemoriasTable = pgTable(
  "atendimento_ia_memorias",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: text("usuario_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    conversaOrigemId: uuid("conversa_origem_id").references(
      () => atendimentoIaConversasTable.id,
      { onDelete: "set null" },
    ),
    categoria: text("categoria").notNull(),
    origem: atendimentoIaOrigemInformacaoEnum("origem").notNull(),
    valorEstruturado: jsonb("valor_estruturado")
      .$type<Record<string, unknown>>()
      .notNull(),
    autorizadaEm: timestamp("autorizada_em").notNull(),
    expiraEm: timestamp("expira_em"),
    restrita: boolean("restrita").notNull().default(false),
    removidaEm: timestamp("removida_em"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    index("atendimento_ia_memorias_usuario_categoria_idx").on(
      table.usuarioId,
      table.categoria,
    ),
    index("atendimento_ia_memorias_expiracao_idx").on(table.expiraEm),
  ],
);
