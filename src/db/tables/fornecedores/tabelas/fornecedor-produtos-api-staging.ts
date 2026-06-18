import {
  index,
  jsonb,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { fornecedorProdutoApiStagingStatusEnum } from "../enums";
import { fornecedorIntegracoesApiTable } from "./fornecedor-integracoes-api";

type DadosBrutosJsonProdutoApi = Record<string, unknown>;

export const fornecedorProdutosApiStagingTable = pgTable(
  "fornecedor_produtos_api_staging",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    integracaoApiId: uuid("integracao_api_id")
      .notNull()
      .references(() => fornecedorIntegracoesApiTable.id, {
        onDelete: "cascade",
      }),
    codigoFornecedor: text("codigo_fornecedor").notNull(),
    nomeProduto: text("nome_produto").notNull(),
    ean: text("ean"),
    ncm: text("ncm"),
    marcaFornecedor: text("marca_fornecedor"),
    grupoFornecedor: text("grupo_fornecedor"),
    subgrupoFornecedor: text("subgrupo_fornecedor"),
    precoFornecedor: numeric("preco_fornecedor", { precision: 12, scale: 2 }),
    estoqueFornecedor: integer("estoque_fornecedor"),
    imagemUrl: text("imagem_url"),
    unidade: text("unidade"),
    pesoBruto: numeric("peso_bruto", { precision: 12, scale: 4 }),
    pesoLiquido: numeric("peso_liquido", { precision: 12, scale: 4 }),
    largura: numeric("largura", { precision: 12, scale: 4 }),
    altura: numeric("altura", { precision: 12, scale: 4 }),
    comprimento: numeric("comprimento", { precision: 12, scale: 4 }),
    dadosBrutosJson: jsonb("dados_brutos_json")
      .$type<DadosBrutosJsonProdutoApi>()
      .default({})
      .notNull(),
    status: fornecedorProdutoApiStagingStatusEnum("status")
      .notNull()
      .default("novo"),
    ultimaConsultaEm: timestamp("ultima_consulta_em").notNull(),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    index("fornecedor_produtos_api_staging_integracao_api_id_idx").on(
      table.integracaoApiId,
    ),
    index("fornecedor_produtos_api_staging_status_idx").on(table.status),
    index("fornecedor_produtos_api_staging_codigo_fornecedor_idx").on(
      table.codigoFornecedor,
    ),
    index("fornecedor_produtos_api_staging_ean_idx").on(table.ean),
    index("fornecedor_produtos_api_staging_marca_fornecedor_idx").on(
      table.marcaFornecedor,
    ),
    index("fornecedor_produtos_api_staging_grupo_fornecedor_idx").on(
      table.grupoFornecedor,
    ),
    uniqueIndex("fornecedor_produtos_api_staging_integracao_codigo_unique").on(
      table.integracaoApiId,
      table.codigoFornecedor,
    ),
  ],
);

export type FornecedorProdutoApiStaging =
  typeof fornecedorProdutosApiStagingTable.$inferSelect;
export type NovoFornecedorProdutoApiStaging =
  typeof fornecedorProdutosApiStagingTable.$inferInsert;
