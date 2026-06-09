import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { cuponsPromocaoTable } from "./cupons-promocao";

export const usosCuponsPromocaoTable = pgTable(
  "usos_cupons_promocao",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cupomPromocaoId: uuid("cupom_promocao_id")
      .notNull()
      .references(() => cuponsPromocaoTable.id, { onDelete: "cascade" }),
    clienteId: uuid("cliente_id"),
    pedidoId: uuid("pedido_id"),
    codigoCupom: text("codigo_cupom").notNull(),
    valorDescontoEmCentavos: integer("valor_desconto_em_centavos")
      .notNull()
      .default(0),
    usadoEm: timestamp("usado_em").notNull().defaultNow(),
  },
  (table) => [
    index("usos_cupons_promocao_cupom_id_idx").on(table.cupomPromocaoId),
    index("usos_cupons_promocao_cliente_id_idx").on(table.clienteId),
    index("usos_cupons_promocao_codigo_idx").on(table.codigoCupom),
    uniqueIndex("usos_cupons_promocao_pedido_cupom_unique").on(
      table.pedidoId,
      table.cupomPromocaoId,
    ),
  ],
);

export type UsoCupomPromocao = typeof usosCuponsPromocaoTable.$inferSelect;
export type NovoUsoCupomPromocao = typeof usosCuponsPromocaoTable.$inferInsert;
