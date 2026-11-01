import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { productTable } from "../../table/products/products";
import { userTable } from "../autenticacao";
import { autorizacoesProdutosRepresentantesTable } from "./tabelas";
/** Identidade pública explícita. Não contém sessão, credencial ou mensagem do Jaaa. */
export const identidadesJaaaRepresentantesTable = pgTable(
  "identidades_jaaa_representantes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: text("usuario_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    identidade: text("identidade").notNull(),
    ativa: boolean("ativa").notNull().default(false),
    atualizadoPorUsuarioId: text("atualizado_por_usuario_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("identidades_jaaa_representantes_usuario_unico").on(
      t.usuarioId,
    ),
    check(
      "identidades_jaaa_representantes_formato",
      sql`${t.identidade} ~ '^[a-z][a-z0-9_]{2,29}$'`,
    ),
  ],
);
/** Atendimento é opcional, determinístico e independente do destinatário da comissão. */
export const atendimentosJaaaProdutosTable = pgTable(
  "atendimentos_jaaa_produtos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    produtoId: uuid("produto_id")
      .notNull()
      .references(() => productTable.id, { onDelete: "restrict" }),
    autorizacaoId: uuid("autorizacao_id").references(
      () => autorizacoesProdutosRepresentantesTable.id,
      { onDelete: "restrict" },
    ),
    atualizadoPorUsuarioId: text("atualizado_por_usuario_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("atendimentos_jaaa_produtos_produto_unico").on(t.produtoId),
  ],
);
export const identidadesJaaaRepresentantesRelations = relations(
  identidadesJaaaRepresentantesTable,
  ({ one }) => ({
    usuario: one(userTable, {
      fields: [identidadesJaaaRepresentantesTable.usuarioId],
      references: [userTable.id],
      relationName: "identidadeJaaaUsuario",
    }),
    gestor: one(userTable, {
      fields: [identidadesJaaaRepresentantesTable.atualizadoPorUsuarioId],
      references: [userTable.id],
      relationName: "identidadeJaaaGestor",
    }),
  }),
);
export const atendimentosJaaaProdutosRelations = relations(
  atendimentosJaaaProdutosTable,
  ({ one }) => ({
    produto: one(productTable, {
      fields: [atendimentosJaaaProdutosTable.produtoId],
      references: [productTable.id],
    }),
    autorizacao: one(autorizacoesProdutosRepresentantesTable, {
      fields: [atendimentosJaaaProdutosTable.autorizacaoId],
      references: [autorizacoesProdutosRepresentantesTable.id],
    }),
    gestor: one(userTable, {
      fields: [atendimentosJaaaProdutosTable.atualizadoPorUsuarioId],
      references: [userTable.id],
    }),
  }),
);
