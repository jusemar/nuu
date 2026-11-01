import {
  index,
  integer,
  jsonb,
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
    // Snapshot sem FK: a categoria da venda deve sobreviver a futuras alterações/exclusões.
    categoriaId: uuid("categoria_id"),
    varianteId: uuid("variante_id"),
    nomeProduto: text("nome_produto").notNull(),
    nomeVariante: text("nome_variante"),
    atributosVariante: jsonb("atributos_variante")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    skuProduto: text("sku_produto"),
    modalidade: text("modalidade"),
    prazoModalidade: text("prazo_modalidade"),
    imagemUrl: text("imagem_url"),
    quantidade: integer("quantidade").notNull(),
    precoUnitarioEmCentavos: integer("preco_unitario_em_centavos").notNull(),
    totalEmCentavos: integer("total_em_centavos").notNull(),
    // Novos itens congelam a base comercial; NULL legado impede cálculo retroativo.
    precoComercialUnitarioEmCentavos: integer("preco_comercial_unitario_em_centavos"),
    descontoCupomRateadoEmCentavos: integer("desconto_cupom_rateado_em_centavos"),
    creditoFidelidadeRateadoEmCentavos: integer(
      "credito_fidelidade_rateado_em_centavos",
    )
      .notNull()
      .default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("checkout_pedido_itens_pedido_id_idx").on(table.pedidoId)],
);
