import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { perfisClientesTable } from "./perfis-clientes";
import { userTable } from "./usuarios";

export const enderecosClientesTable = pgTable(
  "enderecos_clientes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    perfilClienteId: uuid("perfil_cliente_id")
      .notNull()
      .references(() => perfisClientesTable.id, { onDelete: "cascade" }),
    cep: text("cep").notNull(),
    rua: text("rua").notNull(),
    numero: text("numero").notNull(),
    complemento: text("complemento"),
    bairro: text("bairro").notNull(),
    cidade: text("cidade").notNull(),
    estado: text("estado").notNull(),
    autorizarEntregaVizinho: boolean("autorizar_entrega_vizinho")
      .notNull()
      .default(false),
    nomeVizinho: text("nome_vizinho"),
    observacaoVizinho: text("observacao_vizinho"),
    principal: boolean("principal").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("enderecos_clientes_user_id_principal_unique").on(
      table.userId,
      table.principal,
    ),
    index("enderecos_clientes_perfil_cliente_id_idx").on(table.perfilClienteId),
  ],
);
