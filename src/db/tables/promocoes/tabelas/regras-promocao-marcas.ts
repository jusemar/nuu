import {
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { marcaTable } from "../../../table/marcas/marcas";
import { promocaoTipoDescontoEnum } from "../enums";
import { regrasPromocaoTable } from "./regras-promocao";

export const regrasPromocaoMarcasTable = pgTable(
  "regras_promocao_marcas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    regraPromocaoId: uuid("regra_promocao_id")
      .notNull()
      .references(() => regrasPromocaoTable.id, { onDelete: "cascade" }),
    marcaId: uuid("marca_id")
      .notNull()
      .references(() => marcaTable.id, { onDelete: "cascade" }),
    tipoDesconto: promocaoTipoDescontoEnum("tipo_desconto").notNull(),
    valorDesconto: integer("valor_desconto").notNull(),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("regras_promocao_marcas_regra_marca_unique").on(
      table.regraPromocaoId,
      table.marcaId,
    ),
    index("regras_promocao_marcas_regra_promocao_id_idx").on(
      table.regraPromocaoId,
    ),
    index("regras_promocao_marcas_marca_id_idx").on(table.marcaId),
  ],
);

export type RegraPromocaoMarca = typeof regrasPromocaoMarcasTable.$inferSelect;
export type NovaRegraPromocaoMarca =
  typeof regrasPromocaoMarcasTable.$inferInsert;
