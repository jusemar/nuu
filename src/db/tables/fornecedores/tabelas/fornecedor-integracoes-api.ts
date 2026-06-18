import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  fornecedorIntegracaoApiAmbienteEnum,
  fornecedorIntegracaoApiProvedorEnum,
  fornecedorIntegracaoApiTesteStatusEnum,
} from "../enums";
import { fornecedoresTable } from "./fornecedores";

export const fornecedorIntegracoesApiTable = pgTable(
  "fornecedor_integracoes_api",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fornecedorId: uuid("fornecedor_id")
      .notNull()
      .references(() => fornecedoresTable.id, { onDelete: "restrict" }),
    provedor: fornecedorIntegracaoApiProvedorEnum("provedor").notNull(),
    ambiente: fornecedorIntegracaoApiAmbienteEnum("ambiente")
      .notNull()
      .default("homologacao"),
    urlBase: text("url_base"),
    cnpjEmpresa: text("cnpj_empresa").notNull(),
    tokenClienteCriptografado: text("token_cliente_criptografado"),
    ativo: boolean("ativo").notNull().default(false),
    ultimoTesteStatus: fornecedorIntegracaoApiTesteStatusEnum(
      "ultimo_teste_status",
    )
      .notNull()
      .default("nao_testado"),
    ultimoTesteEm: timestamp("ultimo_teste_em"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    index("fornecedor_integracoes_api_fornecedor_id_idx").on(
      table.fornecedorId,
    ),
    index("fornecedor_integracoes_api_provedor_idx").on(table.provedor),
    index("fornecedor_integracoes_api_ambiente_idx").on(table.ambiente),
    index("fornecedor_integracoes_api_ativo_idx").on(table.ativo),
    uniqueIndex("fornecedor_integracoes_api_fornecedor_provedor_unique").on(
      table.fornecedorId,
      table.provedor,
    ),
  ],
);

export type FornecedorIntegracaoApi =
  typeof fornecedorIntegracoesApiTable.$inferSelect;
export type NovaFornecedorIntegracaoApi =
  typeof fornecedorIntegracoesApiTable.$inferInsert;
