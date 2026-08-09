import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { fornecedorProdutoApiStagingStatusEnum } from "../enums";
import { fornecedorIntegracoesApiTable } from "./fornecedor-integracoes-api";
import { importacoesFornecedorTable } from "./importacoes-fornecedor";

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
    // Execução que trouxe esta linha. É o que dá à integração por API o mesmo
    // ciclo que o arquivo já tem: cada sincronização iniciada pelo gestor vira
    // uma importação própria, com staging, conciliação e histórico separados.
    //
    // Nullable porque as linhas existentes vieram do modelo antigo, em que a
    // API mantinha um retrato global por integração — elas continuam legíveis.
    importacaoId: uuid("importacao_id").references(
      () => importacoesFornecedorTable.id,
      { onDelete: "cascade" },
    ),
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
    index("fornecedor_produtos_api_staging_importacao_id_idx").on(
      table.importacaoId,
    ),
    index("fornecedor_produtos_api_staging_ean_idx").on(table.ean),
    index("fornecedor_produtos_api_staging_marca_fornecedor_idx").on(
      table.marcaFornecedor,
    ),
    index("fornecedor_produtos_api_staging_grupo_fornecedor_idx").on(
      table.grupoFornecedor,
    ),
    // A execução faz parte da identidade da linha.
    //
    // Antes a chave era (integração, código) e existia UM retrato global por
    // integração: buscar de novo o mesmo código sobrescrevia o retrato antigo,
    // e por isso a API nunca teve ciclos independentes. Com a importação na
    // chave, o mesmo `codigoFornecedor` pode existir em #101, #102 e #103 sem
    // conflito — cada ciclo guarda o que a API devolveu naquele momento.
    //
    // As linhas legadas (sem `importacaoId`) ficam fora dessa garantia porque
    // NULL é distinto de NULL em índice único no Postgres. É intencional: elas
    // não são mais escritas por nenhum caminho do fluxo novo.
    uniqueIndex(
      "fornecedor_produtos_api_staging_integracao_importacao_codigo_unique",
    ).on(table.integracaoApiId, table.importacaoId, table.codigoFornecedor),
  ],
);

export type FornecedorProdutoApiStaging =
  typeof fornecedorProdutosApiStagingTable.$inferSelect;
export type NovoFornecedorProdutoApiStaging =
  typeof fornecedorProdutosApiStagingTable.$inferInsert;
