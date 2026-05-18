import {
  boolean,
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { clienteTipoPessoaEnum } from "../enums";
import { userTable } from "./usuarios";

export const perfisClientesTable = pgTable(
  "perfis_clientes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    tipoPessoa: clienteTipoPessoaEnum("tipo_pessoa").notNull(),
    nomeCompleto: text("nome_completo").notNull(),
    documento: text("documento").notNull(),
    telefone: text("telefone").notNull(),
    dataNascimento: date("data_nascimento", { mode: "date" }),
    observacaoCliente: text("observacao_cliente"),
    perfilCompleto: boolean("perfil_completo").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("perfis_clientes_user_id_unique").on(table.userId),
    uniqueIndex("perfis_clientes_documento_unique").on(table.documento),
    index("perfis_clientes_tipo_pessoa_idx").on(table.tipoPessoa),
  ],
);
