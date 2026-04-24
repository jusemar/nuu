import {
  pgTable,
  text,
  timestamp,
  uuid,
  index
} from "drizzle-orm/pg-core";
import { productTable } from "../products/products";
import { pontosColetaTable } from "./pontos-coleta";
import { modalidadesRetiradaTable } from "./modalidades";

export const produtoRetiradaTable = pgTable("produto_retirada", {
  id: uuid().primaryKey().defaultRandom(),
  productId: uuid("product_id").references(() => productTable.id).notNull(),
  pontoColetaId: uuid("ponto_coleta_id").references(() => pontosColetaTable.id).notNull(),
  modalidadeId: uuid("modalidade_id").references(() => modalidadesRetiradaTable.id).notNull(),
  mensagemPersonalizada: text("mensagem_personalizada"),
  createdAt: timestamp("created_id", { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'date', withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  productIdx: index("produto_retirada_product_idx").on(table.productId),
  pontoIdx: index("produto_retirada_ponto_idx").on(table.pontoColetaId),
  modalidadeIdx: index("produto_retirada_modalidade_idx").on(table.modalidadeId),
}));