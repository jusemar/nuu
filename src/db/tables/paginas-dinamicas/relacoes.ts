import { relations } from "drizzle-orm";

import { grupoPaginasTable } from "./tabelas/grupo-paginas";
import { gruposNavegacaoTable } from "./tabelas/grupos-navegacao";
import { paginasDinamicasTable } from "./tabelas/paginas-dinamicas";

export const paginasDinamicasRelations = relations(
  paginasDinamicasTable,
  ({ many }) => ({ grupos: many(grupoPaginasTable) }),
);
export const gruposNavegacaoRelations = relations(
  gruposNavegacaoTable,
  ({ many }) => ({ paginas: many(grupoPaginasTable) }),
);
export const grupoPaginasRelations = relations(
  grupoPaginasTable,
  ({ one }) => ({
    grupo: one(gruposNavegacaoTable, {
      fields: [grupoPaginasTable.grupoId],
      references: [gruposNavegacaoTable.id],
    }),
    pagina: one(paginasDinamicasTable, {
      fields: [grupoPaginasTable.paginaId],
      references: [paginasDinamicasTable.id],
    }),
  }),
);
