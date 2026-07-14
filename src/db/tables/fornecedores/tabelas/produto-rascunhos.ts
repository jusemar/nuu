import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { categoryTable } from "../../../table/categories/categories";
import { marcaTable } from "../../../table/marcas/marcas";
import {
  produtoRascunhoOrigemTipoEnum,
  produtoRascunhoStatusEnum,
} from "../enums";
import { fornecedorIntegracoesApiTable } from "./fornecedor-integracoes-api";
import { fornecedoresTable } from "./fornecedores";

type DadosOrigemRascunhoProduto = Record<string, unknown>;

export const produtoRascunhosTable = pgTable(
  "produto_rascunhos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    origemTipo: produtoRascunhoOrigemTipoEnum("origem_tipo").notNull(),
    origemProvedor: text("origem_provedor"),
    fornecedorId: uuid("fornecedor_id").references(() => fornecedoresTable.id, {
      onDelete: "set null",
    }),
    integracaoApiId: uuid("integracao_api_id").references(
      () => fornecedorIntegracoesApiTable.id,
      { onDelete: "set null" },
    ),
    codigoFornecedor: text("codigo_fornecedor"),
    nome: text("nome").notNull(),
    descricao: text("descricao"),
    categoriaId: uuid("categoria_id").references(() => categoryTable.id, {
      onDelete: "set null",
    }),
    marcaId: uuid("marca_id").references(() => marcaTable.id, {
      onDelete: "set null",
    }),
    ean: text("ean"),
    ncm: text("ncm"),
    precoFornecedor: numeric("preco_fornecedor", { precision: 12, scale: 2 }),
    precoLoja: numeric("preco_loja", { precision: 12, scale: 2 }),
    estoqueFornecedor: integer("estoque_fornecedor"),
    peso: numeric("peso", { precision: 12, scale: 4 }),
    altura: numeric("altura", { precision: 12, scale: 4 }),
    largura: numeric("largura", { precision: 12, scale: 4 }),
    comprimento: numeric("comprimento", { precision: 12, scale: 4 }),
    imagens: jsonb("imagens").$type<string[]>().default([]).notNull(),
    dadosOrigemJson: jsonb("dados_origem_json")
      .$type<DadosOrigemRascunhoProduto>()
      .default({})
      .notNull(),
    status: produtoRascunhoStatusEnum("status")
      .notNull()
      .default("rascunho"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    index("produto_rascunhos_origem_tipo_idx").on(table.origemTipo),
    index("produto_rascunhos_origem_provedor_idx").on(table.origemProvedor),
    index("produto_rascunhos_fornecedor_id_idx").on(table.fornecedorId),
    index("produto_rascunhos_integracao_api_id_idx").on(table.integracaoApiId),
    index("produto_rascunhos_codigo_fornecedor_idx").on(table.codigoFornecedor),
    index("produto_rascunhos_status_idx").on(table.status),
  ],
);

export type ProdutoRascunho = typeof produtoRascunhosTable.$inferSelect;
export type NovoProdutoRascunho = typeof produtoRascunhosTable.$inferInsert;
