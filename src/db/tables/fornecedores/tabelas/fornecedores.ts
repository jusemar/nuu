import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { fornecedorStatusEnum, fornecedorTipoIntegracaoEnum } from "../enums";

export const fornecedoresTable = pgTable(
  "fornecedores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nome: text("nome").notNull(),
    tipoIntegracao: fornecedorTipoIntegracaoEnum("tipo_integracao").notNull(),
    status: fornecedorStatusEnum("status").notNull().default("pendente"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    index("fornecedores_tipo_integracao_idx").on(table.tipoIntegracao),
    index("fornecedores_status_idx").on(table.status),
  ],
);

export type Fornecedor = typeof fornecedoresTable.$inferSelect;
export type NovoFornecedor = typeof fornecedoresTable.$inferInsert;
