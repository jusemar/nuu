import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { userTable } from "../../autenticacao/tabelas/usuarios";

export const checkoutClientesTable = pgTable(
  "checkout_clientes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // `set null` preserva o cliente e todo o histórico comercial quando uma
    // identidade é removida; pedidos nunca devem ser apagados em cascata.
    userId: text("user_id").references(() => userTable.id, {
      onDelete: "set null",
    }),
    nome: text("nome").notNull(),
    email: text("email").notNull(),
    telefone: text("telefone").notNull(),
    documento: text("documento").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("checkout_clientes_email_idx").on(table.email),
    index("checkout_clientes_user_id_idx").on(table.userId),
    uniqueIndex("checkout_clientes_documento_unique").on(table.documento),
  ],
);
