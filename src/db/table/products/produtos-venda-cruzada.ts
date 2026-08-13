import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { productTable } from "./products";

/**
 * Relação manual e ordenada entre o produto da PDP e os produtos oferecidos.
 * Preço, variante e disponibilidade não são copiados: continuam pertencendo
 * aos respectivos domínios e são sempre consultados em suas fontes oficiais.
 */
export const produtosVendaCruzadaTable = pgTable(
  "produtos_venda_cruzada",
  {
    id: uuid().primaryKey().defaultRandom(),
    produtoPrincipalId: uuid("produto_principal_id")
      .notNull()
      .references(() => productTable.id, { onDelete: "cascade" }),
    produtoOferecidoId: uuid("produto_oferecido_id")
      .notNull()
      .references(() => productTable.id, { onDelete: "cascade" }),
    ordem: integer().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (tabela) => [
    uniqueIndex("produtos_venda_cruzada_principal_oferecido_unico").on(
      tabela.produtoPrincipalId,
      tabela.produtoOferecidoId,
    ),
    uniqueIndex("produtos_venda_cruzada_principal_ordem_unica").on(
      tabela.produtoPrincipalId,
      tabela.ordem,
    ),
    check(
      "produtos_venda_cruzada_sem_autorrelacionamento",
      sql`${tabela.produtoPrincipalId} <> ${tabela.produtoOferecidoId}`,
    ),
    check(
      "produtos_venda_cruzada_ordem_valida",
      sql`${tabela.ordem} >= 0 AND ${tabela.ordem} < 4`,
    ),
  ],
);
