import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { productVariantTable } from "../../../table/products/product-variants";
import { checkoutPedidosTable } from "./pedidos";

/** A criação usa apenas `alocada`; as transições serão implementadas depois. */
export const checkoutEstoqueAlocacaoStatusEnum = pgEnum(
  "checkout_estoque_alocacao_status",
  ["alocada", "liberada", "comprometida"],
);

/** Uma linha por pedido + variante; o saldo disponível continua em product_variant. */
export const checkoutEstoqueAlocacoesTable = pgTable(
  "checkout_estoque_alocacoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pedidoId: uuid("pedido_id")
      .notNull()
      .references(() => checkoutPedidosTable.id, { onDelete: "cascade" }),
    varianteId: uuid("variante_id")
      .notNull()
      .references(() => productVariantTable.id, { onDelete: "restrict" }),
    quantidade: integer("quantidade").notNull(),
    modalidade: text("modalidade").notNull().default("stock"),
    status: checkoutEstoqueAlocacaoStatusEnum("status")
      .notNull()
      .default("alocada"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("checkout_estoque_alocacoes_pedido_variante_unique").on(
      table.pedidoId,
      table.varianteId,
    ),
    index("checkout_estoque_alocacoes_variante_status_idx").on(
      table.varianteId,
      table.status,
    ),
    check("checkout_estoque_alocacoes_quantidade_positiva", sql`${table.quantidade} > 0`),
    check("checkout_estoque_alocacoes_modalidade_stock", sql`${table.modalidade} = 'stock'`),
  ],
);
