import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const configuracoesPagamentoTable = pgTable(
  "configuracoes_pagamento",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nome: text("nome").notNull(),
    ativo: boolean("ativo").notNull().default(true),
    pixAtivo: boolean("pix_ativo").notNull().default(true),
    cartaoAtivo: boolean("cartao_ativo").notNull().default(true),
    boletoAtivo: boolean("boleto_ativo").notNull().default(false),
    percentualAcrescimoCartaoBps: integer("percentual_acrescimo_cartao_bps")
      .notNull()
      .default(1500),
    parcelasSemJuros: integer("parcelas_sem_juros").notNull().default(3),
    taxaJurosMensalBps: integer("taxa_juros_mensal_bps").notNull().default(199),
    maximoParcelas: integer("maximo_parcelas").notNull().default(10),
    valorMinimoParcelaEmCentavos: integer("valor_minimo_parcela_em_centavos")
      .notNull()
      .default(500),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("configuracoes_pagamento_ativo_idx").on(table.ativo)],
);
