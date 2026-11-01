import { relations, sql } from "drizzle-orm";
import {
  bigint,
  check,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { administradoresTable } from "../../autorizacao-admin";
import { checkoutItemComissoesTable } from "./item-comissoes";
/** Registro integral e único de quitação EXTERNA; não executa qualquer pagamento. */
export const checkoutItemComissaoQuitacoesTable = pgTable(
  "checkout_item_comissao_quitacoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    comissaoId: uuid("comissao_id")
      .notNull()
      .references(() => checkoutItemComissoesTable.id, {
        onDelete: "restrict",
      }),
    responsavelAdministradorId: uuid("responsavel_administrador_id")
      .notNull()
      .references(() => administradoresTable.id, { onDelete: "restrict" }),
    dataQuitacao: timestamp("data_quitacao", { withTimezone: true }).notNull(),
    valorEmCentavos: bigint("valor_em_centavos", { mode: "number" }).notNull(),
    referencia: text("referencia"),
    observacao: text("observacao"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("checkout_item_comissao_quitacao_unica").on(t.comissaoId),
    check(
      "checkout_item_comissao_quitacao_valor_valido",
      sql`${t.valorEmCentavos} BETWEEN 0 AND 9007199254740991`,
    ),
  ],
);
export const checkoutItemComissaoQuitacoesRelations = relations(
  checkoutItemComissaoQuitacoesTable,
  ({ one }) => ({
    comissao: one(checkoutItemComissoesTable, {
      fields: [checkoutItemComissaoQuitacoesTable.comissaoId],
      references: [checkoutItemComissoesTable.id],
    }),
    responsavel: one(administradoresTable, {
      fields: [checkoutItemComissaoQuitacoesTable.responsavelAdministradorId],
      references: [administradoresTable.id],
    }),
  }),
);
