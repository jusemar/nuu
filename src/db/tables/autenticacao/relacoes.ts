import { relations } from "drizzle-orm";

import { enderecosClientesTable } from "./tabelas/enderecos-clientes";
import { perfisClientesTable } from "./tabelas/perfis-clientes";
import { userTable } from "./tabelas/usuarios";

export const usuariosRelations = relations(userTable, ({ many, one }) => ({
  perfilCliente: one(perfisClientesTable, {
    fields: [userTable.id],
    references: [perfisClientesTable.userId],
  }),
  enderecosCliente: many(enderecosClientesTable),
}));

export const perfisClientesRelations = relations(
  perfisClientesTable,
  ({ many, one }) => ({
    usuario: one(userTable, {
      fields: [perfisClientesTable.userId],
      references: [userTable.id],
    }),
    enderecos: many(enderecosClientesTable),
  }),
);

export const enderecosClientesRelations = relations(
  enderecosClientesTable,
  ({ one }) => ({
    usuario: one(userTable, {
      fields: [enderecosClientesTable.userId],
      references: [userTable.id],
    }),
    perfilCliente: one(perfisClientesTable, {
      fields: [enderecosClientesTable.perfilClienteId],
      references: [perfisClientesTable.id],
    }),
  }),
);
