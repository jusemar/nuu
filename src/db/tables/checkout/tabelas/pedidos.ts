import {
  index,
  integer,
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import {
  checkoutPagamentoGatewayEnum,
  checkoutPagamentoStatusEnum,
  checkoutPedidoStatusEnum,
} from "../enums";
import { checkoutClientesTable } from "./clientes";
import { checkoutEnderecosTable } from "./enderecos";

export const checkoutPedidosTable = pgTable(
  "checkout_pedidos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    numeroPedido: text("numero_pedido").notNull().unique(),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => checkoutClientesTable.id, { onDelete: "restrict" }),
    enderecoId: uuid("endereco_id")
      .notNull()
      .references(() => checkoutEnderecosTable.id, { onDelete: "restrict" }),
    status: checkoutPedidoStatusEnum("status").notNull().default("pending"),
    subtotalEmCentavos: integer("subtotal_em_centavos").notNull(),
    freteEmCentavos: integer("frete_em_centavos").notNull(),
    descontoEmCentavos: integer("desconto_em_centavos").notNull().default(0),
    totalEmCentavos: integer("total_em_centavos").notNull(),
    gatewayPagamento:
      checkoutPagamentoGatewayEnum("gateway_pagamento").notNull(),
    pagamentoStatus: checkoutPagamentoStatusEnum("pagamento_status")
      .notNull()
      .default("pending"),
    observacao: text("observacao"),
    observacaoCliente: text("observacao_cliente"),
    autorizarEntregaVizinho: boolean("autorizar_entrega_vizinho")
      .notNull()
      .default(false),
    nomeVizinho: text("nome_vizinho"),
    observacaoVizinho: text("observacao_vizinho"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("checkout_pedidos_cliente_id_idx").on(table.clienteId),
    index("checkout_pedidos_status_idx").on(table.status),
  ],
);
