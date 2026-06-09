import { index, integer, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { promocaoTipoDescontoEnum } from "../enums";
import { regrasPromocaoTable } from "./regras-promocao";

export const regrasPromocaoSubtotaisTable = pgTable(
  "regras_promocao_subtotais",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    regraPromocaoId: uuid("regra_promocao_id")
      .notNull()
      .references(() => regrasPromocaoTable.id, { onDelete: "cascade" }),
    subtotalMinimo: integer("subtotal_minimo").notNull(),
    subtotalMaximo: integer("subtotal_maximo"),
    tipoDesconto: promocaoTipoDescontoEnum("tipo_desconto").notNull(),
    valorDesconto: integer("valor_desconto").notNull(),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
  },
  (table) => [
    index("regras_promocao_subtotais_regra_promocao_id_idx").on(
      table.regraPromocaoId,
    ),
    index("regras_promocao_subtotais_faixa_idx").on(
      table.subtotalMinimo,
      table.subtotalMaximo,
    ),
  ],
);

export type RegraPromocaoSubtotal =
  typeof regrasPromocaoSubtotaisTable.$inferSelect;
export type NovaRegraPromocaoSubtotal =
  typeof regrasPromocaoSubtotaisTable.$inferInsert;
