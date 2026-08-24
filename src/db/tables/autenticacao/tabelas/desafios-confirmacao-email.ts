import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { userTable } from "./usuarios";

export const desafiosConfirmacaoEmailTable = pgTable(
  "desafios_confirmacao_email",
  {
    id: uuid("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    novoEmail: text("novo_email").notNull(),
    novoEmailHash: text("novo_email_hash").notNull(),
    tokenHash: text("token_hash").notNull(),
    ipHash: text("ip_hash").notNull(),
    tentativas: integer("tentativas").notNull().default(0),
    expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
    consumidoEm: timestamp("consumido_em", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("desafios_confirmacao_email_token_hash_unique").on(
      table.tokenHash,
    ),
    index("desafios_confirmacao_email_usuario_data_idx").on(
      table.userId,
      table.createdAt,
    ),
    index("desafios_confirmacao_email_novo_email_data_idx").on(
      table.novoEmailHash,
      table.createdAt,
    ),
    index("desafios_confirmacao_email_expira_em_idx").on(table.expiraEm),
    check(
      "desafios_confirmacao_email_tentativas_check",
      sql`${table.tentativas} between 0 and 5`,
    ),
  ],
);

export const tentativasConfirmacaoEmailTable = pgTable(
  "tentativas_confirmacao_email",
  {
    id: uuid("id").primaryKey(),
    ipHash: text("ip_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("tentativas_confirmacao_email_ip_data_idx").on(
      table.ipHash,
      table.createdAt,
    ),
  ],
);
