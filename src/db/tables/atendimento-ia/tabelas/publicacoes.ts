import { sql } from "drizzle-orm";
import {
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

/** Registro imutável que dá identidade, idempotência e autoria à publicação. */
export const atendimentoIaPublicacoesTable = pgTable(
  "atendimento_ia_publicacoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tipo: text("tipo").notNull(),
    identidade: text("identidade").notNull(),
    chaveIdempotencia: text("chave_idempotencia").notNull(),
    hashRequisicao: text("hash_requisicao").notNull(),
    status: text("status").notNull().default("processando"),
    justificativaAlertas: text("justificativa_alertas"),
    publicadoPorId: text("publicado_por_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    publicadoEm: timestamp("publicado_em"),
    erroSanitizado: text("erro_sanitizado"),
    metadados: jsonb("metadados")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("atendimento_ia_publicacoes_idempotencia_unique").on(
      t.chaveIdempotencia,
    ),
    uniqueIndex("atendimento_ia_publicacoes_identidade_concluida_unique")
      .on(t.identidade)
      .where(sql`${t.status} = 'concluida'`),
    index("atendimento_ia_publicacoes_status_criado_idx").on(
      t.status,
      t.criadoEm,
    ),
  ],
);

/** Ordem congelada dos integrantes de uma publicação individual ou em lote. */
export const atendimentoIaPublicacaoItensTable = pgTable(
  "atendimento_ia_publicacao_itens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicacaoId: uuid("publicacao_id")
      .notNull()
      .references(() => atendimentoIaPublicacoesTable.id, {
        onDelete: "cascade",
      }),
    tipo: text("tipo").notNull(),
    candidatoId: uuid("candidato_id").notNull(),
    hash: text("hash").notNull(),
    ordem: integer("ordem").notNull(),
    versaoAnteriorId: uuid("versao_anterior_id"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("atendimento_ia_publicacao_itens_ordem_unique").on(
      t.publicacaoId,
      t.ordem,
    ),
    uniqueIndex("atendimento_ia_publicacao_itens_candidato_unique").on(
      t.publicacaoId,
      t.candidatoId,
    ),
  ],
);
