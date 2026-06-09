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

import {
  promocaoStatusEnum,
  promocaoTipoBeneficioEnum,
  promocaoTipoCampanhaEnum,
  promocaoTipoDescontoEnum,
} from "../enums";

export const regrasPromocaoTable = pgTable(
  "regras_promocao",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nome: text("nome").notNull(),
    slug: text("slug").notNull(),
    status: promocaoStatusEnum("status").notNull().default("inativa"),
    tipoBeneficio: promocaoTipoBeneficioEnum("tipo_beneficio")
      .notNull()
      .default("desconto"),
    tipoCampanha: promocaoTipoCampanhaEnum("tipo_campanha")
      .notNull()
      .default("normal"),
    tipoDesconto: promocaoTipoDescontoEnum("tipo_desconto").notNull(),
    prioridade: integer("prioridade").notNull().default(0),
    acumulativa: boolean("acumulativa").notNull().default(false),
    dataInicio: timestamp("data_inicio").notNull(),
    dataFim: timestamp("data_fim"),
    badgePromocional: text("badge_promocional"),
    countdownPromocionalDataFim: timestamp("countdown_promocional_data_fim"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("regras_promocao_slug_unique").on(table.slug),
    index("regras_promocao_status_idx").on(table.status),
    index("regras_promocao_tipo_beneficio_idx").on(table.tipoBeneficio),
    index("regras_promocao_tipo_campanha_idx").on(table.tipoCampanha),
    index("regras_promocao_periodo_idx").on(table.dataInicio, table.dataFim),
    index("regras_promocao_prioridade_idx").on(table.prioridade),
  ],
);

export type RegraPromocao = typeof regrasPromocaoTable.$inferSelect;
export type NovaRegraPromocao = typeof regrasPromocaoTable.$inferInsert;
