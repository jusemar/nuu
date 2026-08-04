import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { CapacidadeAtendimentoIaAdmin } from "../../../../features/atendimento-ia/types/admin/permissoes";
import { userTable } from "../../autenticacao";
import { atendimentoIaPapelAdminEnum } from "../enums";

/** Uma linha representa um período de vigência de um papel dentro do Atendente IA. */
export const atendimentoIaPapeisAdminTable = pgTable(
  "atendimento_ia_papeis_admin",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: text("usuario_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    papel: atendimentoIaPapelAdminEnum("papel").notNull(),
    ativo: boolean("ativo").notNull().default(true),
    capacidadesAdicionais: jsonb("capacidades_adicionais")
      .$type<CapacidadeAtendimentoIaAdmin[]>()
      .notNull()
      .default([]),
    origem: text("origem").notNull(),
    atribuidoPorId: text("atribuido_por_id").references(() => userTable.id, {
      onDelete: "restrict",
    }),
    atribuidoEm: timestamp("atribuido_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revogadoPorId: text("revogado_por_id").references(() => userTable.id, {
      onDelete: "restrict",
    }),
    revogadoEm: timestamp("revogado_em", { withTimezone: true }),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("atendimento_ia_papeis_admin_usuario_ativo_unique")
      .on(table.usuarioId)
      .where(sql`${table.ativo} = true`),
    index("atendimento_ia_papeis_admin_papel_ativo_idx").on(
      table.papel,
      table.ativo,
    ),
    index("atendimento_ia_papeis_admin_atribuido_por_idx").on(
      table.atribuidoPorId,
    ),
  ],
);

export type PapelAtendimentoIaAdminPersistido =
  typeof atendimentoIaPapeisAdminTable.$inferSelect;
