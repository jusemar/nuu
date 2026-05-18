import { relations } from "drizzle-orm";

import { userTable } from "../autenticacao";
import { checkoutClientesTable } from "./tabelas/clientes";
import { checkoutEnderecosTable } from "./tabelas/enderecos";
import { checkoutPedidoHistoricosTable } from "./tabelas/pedido-historicos";
import { checkoutPedidoItensTable } from "./tabelas/pedido-itens";
import { checkoutPedidoLogisticasTable } from "./tabelas/pedido-logisticas";
import { checkoutPagamentosTable } from "./tabelas/pagamentos";
import { checkoutPedidosTable } from "./tabelas/pedidos";
import { checkoutStripeWebhookEventosTable } from "./tabelas/stripe-webhook-eventos";

export const checkoutClientesRelations = relations(
  checkoutClientesTable,
  ({ many, one }) => ({
    usuario: one(userTable, {
      fields: [checkoutClientesTable.userId],
      references: [userTable.id],
    }),
    enderecos: many(checkoutEnderecosTable),
    pedidos: many(checkoutPedidosTable),
  }),
);

export const checkoutEnderecosRelations = relations(
  checkoutEnderecosTable,
  ({ one, many }) => ({
    cliente: one(checkoutClientesTable, {
      fields: [checkoutEnderecosTable.clienteId],
      references: [checkoutClientesTable.id],
    }),
    pedidos: many(checkoutPedidosTable),
  }),
);

export const checkoutPedidosRelations = relations(
  checkoutPedidosTable,
  ({ one, many }) => ({
    cliente: one(checkoutClientesTable, {
      fields: [checkoutPedidosTable.clienteId],
      references: [checkoutClientesTable.id],
    }),
    endereco: one(checkoutEnderecosTable, {
      fields: [checkoutPedidosTable.enderecoId],
      references: [checkoutEnderecosTable.id],
    }),
    itens: many(checkoutPedidoItensTable),
    pagamentos: many(checkoutPagamentosTable),
    historicos: many(checkoutPedidoHistoricosTable),
    stripeWebhookEventos: many(checkoutStripeWebhookEventosTable),
    logistica: one(checkoutPedidoLogisticasTable, {
      fields: [checkoutPedidosTable.id],
      references: [checkoutPedidoLogisticasTable.pedidoId],
    }),
  }),
);

export const checkoutPedidoItensRelations = relations(
  checkoutPedidoItensTable,
  ({ one }) => ({
    pedido: one(checkoutPedidosTable, {
      fields: [checkoutPedidoItensTable.pedidoId],
      references: [checkoutPedidosTable.id],
    }),
  }),
);

export const checkoutPagamentosRelations = relations(
  checkoutPagamentosTable,
  ({ one, many }) => ({
    pedido: one(checkoutPedidosTable, {
      fields: [checkoutPagamentosTable.pedidoId],
      references: [checkoutPedidosTable.id],
    }),
    stripeWebhookEventos: many(checkoutStripeWebhookEventosTable),
  }),
);

export const checkoutPedidoHistoricosRelations = relations(
  checkoutPedidoHistoricosTable,
  ({ one }) => ({
    pedido: one(checkoutPedidosTable, {
      fields: [checkoutPedidoHistoricosTable.pedidoId],
      references: [checkoutPedidosTable.id],
    }),
  }),
);

export const checkoutPedidoLogisticasRelations = relations(
  checkoutPedidoLogisticasTable,
  ({ one }) => ({
    pedido: one(checkoutPedidosTable, {
      fields: [checkoutPedidoLogisticasTable.pedidoId],
      references: [checkoutPedidosTable.id],
    }),
  }),
);

export const checkoutStripeWebhookEventosRelations = relations(
  checkoutStripeWebhookEventosTable,
  ({ one }) => ({
    pedido: one(checkoutPedidosTable, {
      fields: [checkoutStripeWebhookEventosTable.pedidoId],
      references: [checkoutPedidosTable.id],
    }),
    pagamento: one(checkoutPagamentosTable, {
      fields: [checkoutStripeWebhookEventosTable.pagamentoId],
      references: [checkoutPagamentosTable.id],
    }),
  }),
);
