import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { productTable } from "../../table/products/products";
import { userTable } from "../autenticacao";
import { autorizacoesProdutosRepresentantesTable } from "./tabelas";
/** Escolha explícita para próximas vendas. Não concede autorização de edição ou comissão por si. */
export const representantesComissionadosProdutosTable = pgTable(
  "representantes_comissionados_produtos",
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
    uniqueIndex("representante_comissionado_produto_unico").on(t.produtoId),
  ],
);
export const representantesComissionadosProdutosRelations = relations(
  representantesComissionadosProdutosTable,
  ({ one }) => ({
    produto: one(productTable, {
      fields: [representantesComissionadosProdutosTable.produtoId],
      references: [productTable.id],
    }),
    autorizacao: one(autorizacoesProdutosRepresentantesTable, {
      fields: [representantesComissionadosProdutosTable.autorizacaoId],
      references: [autorizacoesProdutosRepresentantesTable.id],
    }),
    gestor: one(userTable, {
      fields: [representantesComissionadosProdutosTable.atualizadoPorUsuarioId],
      references: [userTable.id],
    }),
  }),
);
