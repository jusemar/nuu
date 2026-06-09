import {
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import {
  importacaoFornecedorAjusteEscopoEnum,
  importacaoFornecedorAjusteStatusEnum,
  importacaoFornecedorAjusteTipoEnum,
} from "../enums";
import { fornecedorProdutosStagingTable } from "./fornecedor-produtos-staging";
import { importacoesFornecedorTable } from "./importacoes-fornecedor";

export const importacaoFornecedorAjustesTable = pgTable(
  "importacao_fornecedor_ajustes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    importacaoId: uuid("importacao_id")
      .notNull()
      .references(() => importacoesFornecedorTable.id, { onDelete: "cascade" }),
    tipoAjuste: importacaoFornecedorAjusteTipoEnum("tipo_ajuste").notNull(),
    escopoAjuste:
      importacaoFornecedorAjusteEscopoEnum("escopo_ajuste").notNull(),
    valorAjuste: numeric("valor_ajuste", {
      precision: 12,
      scale: 4,
    }).notNull(),
    categoriaFornecedor: text("categoria_fornecedor"),
    produtoStagingId: uuid("produto_staging_id").references(
      () => fornecedorProdutosStagingTable.id,
      { onDelete: "cascade" },
    ),
    status: importacaoFornecedorAjusteStatusEnum("status")
      .notNull()
      .default("ativo"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    index("importacao_fornecedor_ajustes_importacao_id_idx").on(
      table.importacaoId,
    ),
    index("importacao_fornecedor_ajustes_escopo_idx").on(table.escopoAjuste),
    index("importacao_fornecedor_ajustes_status_idx").on(table.status),
    index("importacao_fornecedor_ajustes_categoria_idx").on(
      table.categoriaFornecedor,
    ),
    index("importacao_fornecedor_ajustes_produto_staging_id_idx").on(
      table.produtoStagingId,
    ),
  ],
);

export type ImportacaoFornecedorAjuste =
  typeof importacaoFornecedorAjustesTable.$inferSelect;
export type NovaImportacaoFornecedorAjuste =
  typeof importacaoFornecedorAjustesTable.$inferInsert;
