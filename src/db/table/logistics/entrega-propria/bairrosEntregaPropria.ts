import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { cities } from "../cities/cities";
import { shippingRegions } from "./shippingRegions";

/**
 * Identidade canônica de bairro da Entrega Própria.
 *
 * Um bairro pode herdar a agenda de sua região ou, quando não estiver
 * regionalizado, diretamente da cidade. Preço não pertence a esta tabela.
 */
export const bairrosEntregaPropria = pgTable(
  "bairros_entrega_propria",
  {
    id: serial("id").primaryKey(),
    nome: varchar("nome", { length: 100 }).notNull(),
    nomeNormalizado: varchar("nome_normalizado", { length: 120 }).notNull(),
    cidadeId: integer("cidade_id")
      .notNull()
      .references(() => cities.id, { onDelete: "restrict" }),
    regiaoId: integer("regiao_id").references(() => shippingRegions.id, {
      onDelete: "restrict",
    }),
    ativo: boolean("ativo").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("bairros_entrega_propria_cidade_nome_uidx").on(
      table.cidadeId,
      table.nomeNormalizado,
    ),
    uniqueIndex("bairros_entrega_propria_id_cidade_uidx").on(
      table.id,
      table.cidadeId,
    ),
  ],
);

export const bairrosEntregaPropriaRelations = relations(
  bairrosEntregaPropria,
  ({ one }) => ({
    cidade: one(cities, {
      fields: [bairrosEntregaPropria.cidadeId],
      references: [cities.id],
    }),
    regiao: one(shippingRegions, {
      fields: [bairrosEntregaPropria.regiaoId],
      references: [shippingRegions.id],
    }),
  }),
);

export type BairroEntregaPropria = typeof bairrosEntregaPropria.$inferSelect;
export type NovoBairroEntregaPropria =
  typeof bairrosEntregaPropria.$inferInsert;
