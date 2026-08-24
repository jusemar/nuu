import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { efeitoPermissaoAdministradorEnum } from "../enums";
import {
  administradoresTable,
  funcoesAdministrativasTable,
  permissoesAdministrativasTable,
} from "./principais";

/** Permissões herdadas por todos os administradores que possuem a função. */
export const funcoesPermissoesTable = pgTable(
  "funcoes_permissoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    funcaoId: uuid("funcao_id")
      .notNull()
      .references(() => funcoesAdministrativasTable.id, {
        onDelete: "cascade",
      }),
    permissaoId: uuid("permissao_id")
      .notNull()
      .references(() => permissoesAdministrativasTable.id, {
        onDelete: "restrict",
      }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("funcoes_permissoes_funcao_permissao_unique").on(
      table.funcaoId,
      table.permissaoId,
    ),
    index("funcoes_permissoes_permissao_id_idx").on(table.permissaoId),
  ],
);

/** Um administrador pode compor responsabilidades de mais de uma função. */
export const administradoresFuncoesTable = pgTable(
  "administradores_funcoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    administradorId: uuid("administrador_id")
      .notNull()
      .references(() => administradoresTable.id, { onDelete: "cascade" }),
    funcaoId: uuid("funcao_id")
      .notNull()
      .references(() => funcoesAdministrativasTable.id, {
        onDelete: "restrict",
      }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("administradores_funcoes_administrador_funcao_unique").on(
      table.administradorId,
      table.funcaoId,
    ),
    index("administradores_funcoes_funcao_id_idx").on(table.funcaoId),
  ],
);

/** Exceção explícita, permitindo ou negando uma permissão para uma pessoa. */
export const administradoresPermissoesTable = pgTable(
  "administradores_permissoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    administradorId: uuid("administrador_id")
      .notNull()
      .references(() => administradoresTable.id, { onDelete: "cascade" }),
    permissaoId: uuid("permissao_id")
      .notNull()
      .references(() => permissoesAdministrativasTable.id, {
        onDelete: "restrict",
      }),
    efeito: efeitoPermissaoAdministradorEnum("efeito").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("administradores_permissoes_admin_permissao_unique").on(
      table.administradorId,
      table.permissaoId,
    ),
    index("administradores_permissoes_permissao_id_idx").on(table.permissaoId),
  ],
);
