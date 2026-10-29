import { relations } from "drizzle-orm";

import { productTable } from "../../table/products/products";
import { userTable } from "../autenticacao/tabelas/usuarios";
import { fornecedoresTable } from "../fornecedores/tabelas/fornecedores";
import {
  autorizacoesProdutosRepresentantesTable,
  representantesFornecedoresTable,
} from "./tabelas";

export const representantesFornecedoresRelations = relations(
  representantesFornecedoresTable,
  ({ one, many }) => ({
    usuario: one(userTable, {
      fields: [representantesFornecedoresTable.usuarioId],
      references: [userTable.id],
      relationName: "usuarioRepresentante",
    }),
    fornecedor: one(fornecedoresTable, {
      fields: [representantesFornecedoresTable.fornecedorId],
      references: [fornecedoresTable.id],
    }),
    criadoPor: one(userTable, {
      fields: [representantesFornecedoresTable.criadoPorUsuarioId],
      references: [userTable.id],
      relationName: "criadorRepresentante",
    }),
    atualizadoPor: one(userTable, {
      fields: [representantesFornecedoresTable.atualizadoPorUsuarioId],
      references: [userTable.id],
      relationName: "atualizadorRepresentante",
    }),
    autorizacoes: many(autorizacoesProdutosRepresentantesTable),
  }),
);

export const autorizacoesProdutosRepresentantesRelations = relations(
  autorizacoesProdutosRepresentantesTable,
  ({ one }) => ({
    representante: one(representantesFornecedoresTable, {
      fields: [
        autorizacoesProdutosRepresentantesTable.representanteFornecedorId,
      ],
      references: [representantesFornecedoresTable.id],
    }),
    produto: one(productTable, {
      fields: [autorizacoesProdutosRepresentantesTable.produtoId],
      references: [productTable.id],
    }),
    criadoPor: one(userTable, {
      fields: [autorizacoesProdutosRepresentantesTable.criadoPorUsuarioId],
      references: [userTable.id],
      relationName: "criadorAutorizacaoRepresentante",
    }),
    atualizadoPor: one(userTable, {
      fields: [autorizacoesProdutosRepresentantesTable.atualizadoPorUsuarioId],
      references: [userTable.id],
      relationName: "atualizadorAutorizacaoRepresentante",
    }),
  }),
);
