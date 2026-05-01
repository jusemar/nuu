import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const modelosRetiradaTable = pgTable("modelos_retirada", {
  id: uuid().primaryKey().defaultRandom(),
  nome: text().notNull(),
  prazoTexto: text("prazo_texto").notNull(),
  mensagem: text(),
  ativo: boolean().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
