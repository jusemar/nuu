import { relations } from "drizzle-orm";

import { userTable } from "../autenticacao";
import {
  administradoresFuncoesTable,
  administradoresPermissoesTable,
  funcoesPermissoesTable,
} from "./tabelas/associacoes";
import { auditoriasAdministrativasTable } from "./tabelas/auditoria";
import {
  convitesAdministrativosTable,
  convitesFuncoesTable,
  convitesPermissoesTable,
} from "./tabelas/convites";
import {
  administradoresTable,
  funcoesAdministrativasTable,
  permissoesAdministrativasTable,
} from "./tabelas/principais";

export const administradoresRelations = relations(
  administradoresTable,
  ({ many, one }) => ({
    usuario: one(userTable, {
      fields: [administradoresTable.usuarioId],
      references: [userTable.id],
    }),
    funcoes: many(administradoresFuncoesTable),
    permissoesPersonalizadas: many(administradoresPermissoesTable),
    convitesEmitidos: many(convitesAdministrativosTable),
    auditoriasComoAtor: many(auditoriasAdministrativasTable, {
      relationName: "auditoriaAtor",
    }),
    auditoriasComoAlvo: many(auditoriasAdministrativasTable, {
      relationName: "auditoriaAlvo",
    }),
  }),
);

export const funcoesAdministrativasRelations = relations(
  funcoesAdministrativasTable,
  ({ many }) => ({
    administradores: many(administradoresFuncoesTable),
    permissoes: many(funcoesPermissoesTable),
    convites: many(convitesFuncoesTable),
  }),
);

export const permissoesAdministrativasRelations = relations(
  permissoesAdministrativasTable,
  ({ many }) => ({
    funcoes: many(funcoesPermissoesTable),
    administradores: many(administradoresPermissoesTable),
    convites: many(convitesPermissoesTable),
  }),
);

export const funcoesPermissoesRelations = relations(
  funcoesPermissoesTable,
  ({ one }) => ({
    funcao: one(funcoesAdministrativasTable, {
      fields: [funcoesPermissoesTable.funcaoId],
      references: [funcoesAdministrativasTable.id],
    }),
    permissao: one(permissoesAdministrativasTable, {
      fields: [funcoesPermissoesTable.permissaoId],
      references: [permissoesAdministrativasTable.id],
    }),
  }),
);

export const administradoresFuncoesRelations = relations(
  administradoresFuncoesTable,
  ({ one }) => ({
    administrador: one(administradoresTable, {
      fields: [administradoresFuncoesTable.administradorId],
      references: [administradoresTable.id],
    }),
    funcao: one(funcoesAdministrativasTable, {
      fields: [administradoresFuncoesTable.funcaoId],
      references: [funcoesAdministrativasTable.id],
    }),
  }),
);

export const administradoresPermissoesRelations = relations(
  administradoresPermissoesTable,
  ({ one }) => ({
    administrador: one(administradoresTable, {
      fields: [administradoresPermissoesTable.administradorId],
      references: [administradoresTable.id],
    }),
    permissao: one(permissoesAdministrativasTable, {
      fields: [administradoresPermissoesTable.permissaoId],
      references: [permissoesAdministrativasTable.id],
    }),
  }),
);

export const convitesAdministrativosRelations = relations(
  convitesAdministrativosTable,
  ({ many, one }) => ({
    usuarioDestinatario: one(userTable, {
      fields: [convitesAdministrativosTable.usuarioDestinatarioId],
      references: [userTable.id],
    }),
    emissor: one(administradoresTable, {
      fields: [convitesAdministrativosTable.emissorAdministradorId],
      references: [administradoresTable.id],
    }),
    funcoes: many(convitesFuncoesTable),
    permissoesPersonalizadas: many(convitesPermissoesTable),
  }),
);

export const convitesFuncoesRelations = relations(
  convitesFuncoesTable,
  ({ one }) => ({
    convite: one(convitesAdministrativosTable, {
      fields: [convitesFuncoesTable.conviteId],
      references: [convitesAdministrativosTable.id],
    }),
    funcao: one(funcoesAdministrativasTable, {
      fields: [convitesFuncoesTable.funcaoId],
      references: [funcoesAdministrativasTable.id],
    }),
  }),
);

export const convitesPermissoesRelations = relations(
  convitesPermissoesTable,
  ({ one }) => ({
    convite: one(convitesAdministrativosTable, {
      fields: [convitesPermissoesTable.conviteId],
      references: [convitesAdministrativosTable.id],
    }),
    permissao: one(permissoesAdministrativasTable, {
      fields: [convitesPermissoesTable.permissaoId],
      references: [permissoesAdministrativasTable.id],
    }),
  }),
);

export const auditoriasAdministrativasRelations = relations(
  auditoriasAdministrativasTable,
  ({ one }) => ({
    ator: one(administradoresTable, {
      fields: [auditoriasAdministrativasTable.atorAdministradorId],
      references: [administradoresTable.id],
      relationName: "auditoriaAtor",
    }),
    alvo: one(administradoresTable, {
      fields: [auditoriasAdministrativasTable.alvoAdministradorId],
      references: [administradoresTable.id],
      relationName: "auditoriaAlvo",
    }),
  }),
);
