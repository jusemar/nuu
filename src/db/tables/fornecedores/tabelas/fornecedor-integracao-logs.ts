import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { fornecedorIntegracaoLogStatusEnum } from "../enums";
import { fornecedorIntegracoesApiTable } from "./fornecedor-integracoes-api";

export const fornecedorIntegracaoLogsTable = pgTable(
  "fornecedor_integracao_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    integracaoApiId: uuid("integracao_api_id")
      .notNull()
      .references(() => fornecedorIntegracoesApiTable.id, {
        onDelete: "cascade",
      }),
    metodo: text("metodo").notNull(),
    operacao: text("operacao").notNull(),
    status: fornecedorIntegracaoLogStatusEnum("status").notNull(),
    codigoHttp: integer("codigo_http"),
    mensagem: text("mensagem"),
    requestResumo: jsonb("request_resumo")
      .$type<Record<string, string | number | boolean | null>>()
      .default({})
      .notNull(),
    responseResumo: jsonb("response_resumo")
      .$type<Record<string, string | number | boolean | null>>()
      .default({})
      .notNull(),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
  },
  (table) => [
    index("fornecedor_integracao_logs_integracao_api_id_idx").on(
      table.integracaoApiId,
    ),
    index("fornecedor_integracao_logs_metodo_idx").on(table.metodo),
    index("fornecedor_integracao_logs_status_idx").on(table.status),
    index("fornecedor_integracao_logs_criado_em_idx").on(table.criadoEm),
  ],
);

export type FornecedorIntegracaoLog =
  typeof fornecedorIntegracaoLogsTable.$inferSelect;
export type NovaFornecedorIntegracaoLog =
  typeof fornecedorIntegracaoLogsTable.$inferInsert;
