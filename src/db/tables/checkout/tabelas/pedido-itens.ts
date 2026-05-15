import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { checkoutPedidosTable } from "./pedidos";

export const checkoutPedidoItensTable = pgTable(
  "checkout_pedido_itens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pedidoId: uuid("pedido_id")
      .notNull()
      .references(() => checkoutPedidosTable.id, { onDelete: "cascade" }),
    produtoId: uuid("produto_id").notNull(),
    nomeProduto: text("nome_produto").notNull(),
    skuProduto: text("sku_produto"),
    modalidade: text("modalidade"),
    prazoModalidade: text("prazo_modalidade"),
    imagemUrl: text("imagem_url"),
    quantidade: integer("quantidade").notNull(),
    precoUnitarioEmCentavos: integer("preco_unitario_em_centavos").notNull(),
    totalEmCentavos: integer("total_em_centavos").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("checkout_pedido_itens_pedido_id_idx").on(table.pedidoId)],
);
