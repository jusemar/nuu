import { relations } from "drizzle-orm";

import {
  configuracoesBarraAvisosTable,
  mensagensBarraAvisosTable,
} from "./tabelas/barra-avisos";

export const configuracoesBarraAvisosRelations = relations(
  configuracoesBarraAvisosTable,
  ({ many }) => ({ mensagens: many(mensagensBarraAvisosTable) }),
);

export const mensagensBarraAvisosRelations = relations(
  mensagensBarraAvisosTable,
  ({ one }) => ({
    configuracao: one(configuracoesBarraAvisosTable, {
      fields: [mensagensBarraAvisosTable.configuracaoId],
      references: [configuracoesBarraAvisosTable.id],
    }),
  }),
);
