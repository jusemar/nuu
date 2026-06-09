import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { promocaoTipoDescontoEnum } from "../enums";

export const cuponsPromocaoTable = pgTable(
  "cupons_promocao",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    codigo: text("codigo").notNull(),
    nome: text("nome").notNull(),
    ativo: boolean("ativo").notNull().default(false),
    tipoDesconto: promocaoTipoDescontoEnum("tipo_desconto").notNull(),
    valorDesconto: integer("valor_desconto").notNull(),
    freteGratis: boolean("frete_gratis").notNull().default(false),
    prioridade: integer("prioridade").notNull().default(0),
    acumulativo: boolean("acumulativo").notNull().default(false),
    subtotalMinimo: integer("subtotal_minimo").notNull().default(0),
    limiteUsoTotal: integer("limite_uso_total"),
    limiteUsoPorCliente: integer("limite_uso_por_cliente"),
    totalUsos: integer("total_usos").notNull().default(0),
    dataInicio: timestamp("data_inicio").notNull(),
    dataFim: timestamp("data_fim"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("cupons_promocao_codigo_unique").on(table.codigo),
    index("cupons_promocao_ativo_idx").on(table.ativo),
    index("cupons_promocao_periodo_idx").on(table.dataInicio, table.dataFim),
    index("cupons_promocao_prioridade_idx").on(table.prioridade),
  ],
);

export type CupomPromocao = typeof cuponsPromocaoTable.$inferSelect;
export type NovoCupomPromocao = typeof cuponsPromocaoTable.$inferInsert;
