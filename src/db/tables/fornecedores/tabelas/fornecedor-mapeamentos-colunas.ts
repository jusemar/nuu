import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { fornecedorMapeamentoColunaDestinoEnum } from "../enums";
import { fornecedoresTable } from "./fornecedores";

export const fornecedorMapeamentosColunasTable = pgTable(
  "fornecedor_mapeamentos_colunas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fornecedorId: uuid("fornecedor_id")
      .notNull()
      .references(() => fornecedoresTable.id, { onDelete: "cascade" }),
    nomeColunaOrigem: text("nome_coluna_origem").notNull(),
    campoDestino:
      fornecedorMapeamentoColunaDestinoEnum("campo_destino").notNull(),
    ativo: boolean("ativo").notNull().default(true),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    index("fornecedor_mapeamentos_colunas_fornecedor_id_idx").on(
      table.fornecedorId,
    ),
    index("fornecedor_mapeamentos_colunas_campo_destino_idx").on(
      table.campoDestino,
    ),
    uniqueIndex("fornecedor_mapeamentos_colunas_destino_ativo_unique")
      .on(table.fornecedorId, table.campoDestino)
      .where(sql`${table.ativo} = true`),
  ],
);

export type FornecedorMapeamentoColuna =
  typeof fornecedorMapeamentosColunasTable.$inferSelect;
export type NovoFornecedorMapeamentoColuna =
  typeof fornecedorMapeamentosColunasTable.$inferInsert;
