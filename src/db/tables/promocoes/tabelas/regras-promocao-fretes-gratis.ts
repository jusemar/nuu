import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { regrasPromocaoTable } from "./regras-promocao";

export const regrasPromocaoFretesGratisTable = pgTable(
  "regras_promocao_fretes_gratis",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    regraPromocaoId: uuid("regra_promocao_id")
      .notNull()
      .references(() => regrasPromocaoTable.id, { onDelete: "cascade" }),
    subtotalMinimo: integer("subtotal_minimo").notNull(),
    modalidade: text("modalidade"),
    mensagemProgressiva: text("mensagem_progressiva"),
    regiaoCodigo: text("regiao_codigo"),
    transportadoraCodigo: text("transportadora_codigo"),
    servicoCodigo: text("servico_codigo"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
  },
  (table) => [
    index("regras_promocao_fretes_gratis_regra_promocao_id_idx").on(
      table.regraPromocaoId,
    ),
    index("regras_promocao_fretes_gratis_subtotal_idx").on(
      table.subtotalMinimo,
    ),
    index("regras_promocao_fretes_gratis_modalidade_idx").on(table.modalidade),
    index("regras_promocao_fretes_gratis_transportadora_codigo_idx").on(
      table.transportadoraCodigo,
    ),
    index("regras_promocao_fretes_gratis_servico_codigo_idx").on(
      table.servicoCodigo,
    ),
  ],
);

export type RegraPromocaoFreteGratis =
  typeof regrasPromocaoFretesGratisTable.$inferSelect;
export type NovaRegraPromocaoFreteGratis =
  typeof regrasPromocaoFretesGratisTable.$inferInsert;
