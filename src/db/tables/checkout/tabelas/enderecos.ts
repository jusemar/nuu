import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { checkoutClientesTable } from "./clientes";

export const checkoutEnderecosTable = pgTable(
  "checkout_enderecos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => checkoutClientesTable.id, { onDelete: "cascade" }),
    cep: text("cep").notNull(),
    rua: text("rua").notNull(),
    numero: text("numero").notNull(),
    complemento: text("complemento"),
    bairro: text("bairro").notNull(),
    cidade: text("cidade").notNull(),
    estado: text("estado").notNull(),
    observacao: text("observacao"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("checkout_enderecos_cliente_id_idx").on(table.clienteId)],
);
