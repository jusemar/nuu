import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { userTable } from "../../autenticacao";
import {
  administradorStatusEnum,
  funcaoAdministrativaStatusEnum,
  permissaoAdministrativaStatusEnum,
} from "../enums";

/** Liga uma identidade Better Auth ao acesso administrativo global. */
export const administradoresTable = pgTable(
  "administradores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: text("usuario_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    status: administradorStatusEnum("status").notNull().default("ativo"),
    administradorPrincipal: boolean("administrador_principal")
      .notNull()
      .default(false),
    versaoAutorizacao: integer("versao_autorizacao").notNull().default(1),
    ativadoEm: timestamp("ativado_em", { withTimezone: true }),
    desativadoEm: timestamp("desativado_em", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("administradores_usuario_id_unique").on(table.usuarioId),
    index("administradores_status_idx").on(table.status),
    index("administradores_principal_status_idx").on(
      table.administradorPrincipal,
      table.status,
    ),
    check(
      "administradores_versao_autorizacao_positiva_check",
      sql`${table.versaoAutorizacao} > 0`,
    ),
  ],
);

/** Preset reutilizável; a função agrupa permissões, mas não as substitui. */
export const funcoesAdministrativasTable = pgTable(
  "funcoes_administrativas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chave: text("chave").notNull(),
    nome: text("nome").notNull(),
    descricao: text("descricao"),
    funcaoSistema: boolean("funcao_sistema").notNull().default(false),
    status: funcaoAdministrativaStatusEnum("status").notNull().default("ativa"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("funcoes_administrativas_chave_unique").on(table.chave),
    index("funcoes_administrativas_status_idx").on(table.status),
  ],
);

/** Catálogo global de capacidades estáveis no formato recurso.ação. */
export const permissoesAdministrativasTable = pgTable(
  "permissoes_administrativas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chave: text("chave").notNull(),
    nome: text("nome").notNull(),
    descricao: text("descricao"),
    modulo: text("modulo").notNull(),
    status: permissaoAdministrativaStatusEnum("status")
      .notNull()
      .default("ativa"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("permissoes_administrativas_chave_unique").on(table.chave),
    index("permissoes_administrativas_modulo_status_idx").on(
      table.modulo,
      table.status,
    ),
    check(
      "permissoes_administrativas_chave_formato_check",
      sql`${table.chave} ~ '^[a-z0-9_]+[.][a-z0-9_]+$'`,
    ),
  ],
);

export type Administrador = typeof administradoresTable.$inferSelect;
export type FuncaoAdministrativa =
  typeof funcoesAdministrativasTable.$inferSelect;
export type PermissaoAdministrativa =
  typeof permissoesAdministrativasTable.$inferSelect;
