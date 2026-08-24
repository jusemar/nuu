import { relations } from "drizzle-orm";

import { desafiosConfirmacaoEmailTable } from "./tabelas/desafios-confirmacao-email";
import { enderecosClientesTable } from "./tabelas/enderecos-clientes";
import { perfisClientesTable } from "./tabelas/perfis-clientes";
import { userTable } from "./tabelas/usuarios";

export const usuariosRelations = relations(userTable, ({ many, one }) => ({
  perfilCliente: one(perfisClientesTable, {
    fields: [userTable.id],
    references: [perfisClientesTable.userId],
  }),
  enderecosCliente: many(enderecosClientesTable),
  desafiosConfirmacaoEmail: many(desafiosConfirmacaoEmailTable),
}));

export const desafiosConfirmacaoEmailRelations = relations(
  desafiosConfirmacaoEmailTable,
  ({ one }) => ({
    usuario: one(userTable, {
      fields: [desafiosConfirmacaoEmailTable.userId],
      references: [userTable.id],
    }),
  }),
);

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
