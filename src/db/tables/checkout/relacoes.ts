import { relations } from "drizzle-orm";

import { checkoutClientesTable } from "./tabelas/clientes";
import { checkoutEnderecosTable } from "./tabelas/enderecos";
import { checkoutPedidoHistoricosTable } from "./tabelas/pedido-historicos";
import { checkoutPedidoItensTable } from "./tabelas/pedido-itens";
import { checkoutPedidoLogisticasTable } from "./tabelas/pedido-logisticas";
import { checkoutPagamentosTable } from "./tabelas/pagamentos";
import { checkoutPedidosTable } from "./tabelas/pedidos";

export const checkoutClientesRelations = relations(
  checkoutClientesTable,
  ({ many }) => ({
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
  ({ one }) => ({
    pedido: one(checkoutPedidosTable, {
      fields: [checkoutPagamentosTable.pedidoId],
      references: [checkoutPedidosTable.id],
    }),
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
