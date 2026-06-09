import {
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";

import { fornecedorProdutoStagingStatusEnum } from "../enums";
import { fornecedorPrecoOrigemAjusteEnum } from "../enums";
import { productTable } from "../../../table/products/products";
import { importacoesFornecedorTable } from "./importacoes-fornecedor";

export const fornecedorProdutosStagingTable = pgTable(
  "fornecedor_produtos_staging",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    importacaoId: uuid("importacao_id")
      .notNull()
      .references(() => importacoesFornecedorTable.id, { onDelete: "cascade" }),
    codigoFornecedor: text("codigo_fornecedor"),
    nomeProduto: text("nome_produto").notNull(),
    categoriaFornecedor: text("categoria_fornecedor"),
    precoFornecedor: numeric("preco_fornecedor", {
      precision: 12,
      scale: 2,
    }),
    precoOriginal: numeric("preco_original", {
      precision: 12,
      scale: 2,
    }),
    precoCalculado: numeric("preco_calculado", {
      precision: 12,
      scale: 2,
    }),
    origemAjuste: fornecedorPrecoOrigemAjusteEnum("origem_ajuste")
      .notNull()
      .default("nenhum"),
    estoqueFornecedor: integer("estoque_fornecedor"),
    produtoLocalizadoId: uuid("produto_localizado_id").references(
      () => productTable.id,
      { onDelete: "set null" },
    ),
    criterioLocalizacao: text("criterio_localizacao"),
    errosValidacao: jsonb("erros_validacao")
      .$type<Array<{ codigo: string; mensagem: string; campo?: string }>>()
      .default([])
      .notNull(),
    status: fornecedorProdutoStagingStatusEnum("status")
      .notNull()
      .default("aguardando_analise"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    index("fornecedor_produtos_staging_importacao_id_idx").on(
      table.importacaoId,
    ),
    index("fornecedor_produtos_staging_status_idx").on(table.status),
    index("fornecedor_produtos_staging_codigo_fornecedor_idx").on(
      table.codigoFornecedor,
    ),
    index("fornecedor_produtos_staging_produto_localizado_id_idx").on(
      table.produtoLocalizadoId,
    ),
    index("fornecedor_produtos_staging_criterio_localizacao_idx").on(
      table.criterioLocalizacao,
    ),
    index("fornecedor_produtos_staging_origem_ajuste_idx").on(
      table.origemAjuste,
    ),
  ],
);

export type FornecedorProdutoStaging =
  typeof fornecedorProdutosStagingTable.$inferSelect;
export type NovoFornecedorProdutoStaging =
  typeof fornecedorProdutosStagingTable.$inferInsert;
