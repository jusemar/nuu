import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { productTable } from "../../../table/products/products";
import {
  fornecedorProdutoVinculoStatusEnum,
  fornecedorProdutoVinculoTipoEnum,
} from "../enums";
import { fornecedoresTable } from "./fornecedores";

export const fornecedorProdutoVinculosTable = pgTable(
  "fornecedor_produto_vinculos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fornecedorId: uuid("fornecedor_id")
      .notNull()
      .references(() => fornecedoresTable.id, { onDelete: "restrict" }),
    codigoFornecedor: text("codigo_fornecedor"),
    // Saldo informado pelo fornecedor; nunca é alocação de estoque físico da Nooo.
    estoqueInformadoFornecedor: integer("estoque_informado_fornecedor")
      .notNull()
      .default(0),
    produtoId: uuid("produto_id")
      .notNull()
      .references(() => productTable.id, { onDelete: "restrict" }),
    tipoVinculo: fornecedorProdutoVinculoTipoEnum("tipo_vinculo")
      .notNull()
      .default("manual"),
    status: fornecedorProdutoVinculoStatusEnum("status")
      .notNull()
      .default("ativo"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    check(
      "fornecedor_produto_estoque_informado_valido",
      sql`${table.estoqueInformadoFornecedor} >= 0`,
    ),
    index("fornecedor_produto_vinculos_fornecedor_id_idx").on(
      table.fornecedorId,
    ),
    index("fornecedor_produto_vinculos_produto_id_idx").on(table.produtoId),
    index("fornecedor_produto_vinculos_codigo_fornecedor_idx").on(
      table.codigoFornecedor,
    ),
    index("fornecedor_produto_vinculos_status_idx").on(table.status),
  ],
);

export type FornecedorProdutoVinculo =
  typeof fornecedorProdutoVinculosTable.$inferSelect;
export type NovoFornecedorProdutoVinculo =
  typeof fornecedorProdutoVinculosTable.$inferInsert;
