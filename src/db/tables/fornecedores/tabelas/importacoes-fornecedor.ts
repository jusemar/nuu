import {
  integer,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import {
  importacaoFornecedorStatusEnum,
  importacaoFornecedorTipoArquivoEnum,
} from "../enums";
import { fornecedoresTable } from "./fornecedores";

export const importacoesFornecedorTable = pgTable(
  "importacoes_fornecedor",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fornecedorId: uuid("fornecedor_id")
      .notNull()
      .references(() => fornecedoresTable.id, { onDelete: "restrict" }),
    tipoArquivo: importacaoFornecedorTipoArquivoEnum("tipo_arquivo").notNull(),
    status: importacaoFornecedorStatusEnum("status")
      .notNull()
      .default("pendente"),
    nomeArquivo: text("nome_arquivo"),
    totalLinhas: integer("total_linhas").notNull().default(0),
    totalProcessadas: integer("total_processadas").notNull().default(0),
    totalErros: integer("total_erros").notNull().default(0),
    colunasPlanilha: jsonb("colunas_planilha")
      .$type<
        Array<{
          indice: number;
          nomeOriginal: string;
          nomeNormalizado: string;
        }>
      >()
      .default([])
      .notNull(),
    mapeamentoColunas: jsonb("mapeamento_colunas")
      .$type<
        Array<{
          nomeColunaOrigem: string;
          nomeColunaNormalizada: string;
          campoDestino: string | null;
          origem: string | null;
          situacao: string;
        }>
      >()
      .default([])
      .notNull(),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    index("importacoes_fornecedor_fornecedor_id_idx").on(table.fornecedorId),
    index("importacoes_fornecedor_status_idx").on(table.status),
    index("importacoes_fornecedor_criado_em_idx").on(table.criadoEm),
  ],
);

export type ImportacaoFornecedor =
  typeof importacoesFornecedorTable.$inferSelect;
export type NovaImportacaoFornecedor =
  typeof importacoesFornecedorTable.$inferInsert;
