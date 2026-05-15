import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const checkoutClientesTable = pgTable(
  "checkout_clientes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Preparado para login futuro sem exigir autenticação no checkout visitante.
    userId: text("user_id"),
    nome: text("nome").notNull(),
    email: text("email").notNull(),
    telefone: text("telefone").notNull(),
    documento: text("documento").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("checkout_clientes_email_idx").on(table.email),
    uniqueIndex("checkout_clientes_documento_unique").on(table.documento),
  ],
);
