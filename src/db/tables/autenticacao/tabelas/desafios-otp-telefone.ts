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

export const desafiosOtpTelefoneTable = pgTable(
  "desafios_otp_telefone",
  {
    id: uuid("id").primaryKey(),
    telefoneHash: text("telefone_hash").notNull(),
    ipHash: text("ip_hash").notNull(),
    finalidade: text("finalidade").notNull(),
    codigoHash: text("codigo_hash").notNull(),
    tentativas: integer("tentativas").notNull().default(0),
    expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
    consumidoEm: timestamp("consumido_em", { withTimezone: true }),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("desafios_otp_telefone_identidade_unique").on(
      table.telefoneHash,
      table.finalidade,
    ),
    index("desafios_otp_telefone_expira_em_idx").on(table.expiraEm),
    check(
      "desafios_otp_telefone_finalidade_check",
      sql`${table.finalidade} in ('cadastro', 'verificacao', 'recuperacao', 'admin_recuperacao', 'alteracao_numero')`,
    ),
    check(
      "desafios_otp_telefone_tentativas_check",
      sql`${table.tentativas} between 0 and 3`,
    ),
  ],
);

export const emissoesOtpTelefoneTable = pgTable(
  "emissoes_otp_telefone",
  {
    id: uuid("id").primaryKey(),
    telefoneHash: text("telefone_hash").notNull(),
    ipHash: text("ip_hash").notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("emissoes_otp_telefone_numero_data_idx").on(
      table.telefoneHash,
      table.criadoEm,
    ),
    index("emissoes_otp_telefone_ip_data_idx").on(table.ipHash, table.criadoEm),
  ],
);
